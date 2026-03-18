// ── Job Service ──
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import JobSeekerProfile from '../models/JobSeekerProfile.js';
import ApiError from '../utils/ApiError.js';
import normalizeSkills from '../utils/normalizeSkills.js';

// Verify job ownership for authorization
const ensureJobOwnership = (job, currentUser) => {
  if (currentUser.role === 'admin') {
    return;
  }

  if (String(job.createdBy) !== String(currentUser._id)) {
    throw new ApiError(403, 'You can only manage jobs created by your account');
  }
};

// Create a new job listing
export const createJob = async (userId, jobData) => {
  const job = await Job.create({
    ...jobData,
    createdBy: userId,
  });

  return job.populate('createdBy', 'name email role');
};

// Build MongoDB query filter based on search/filter parameters
const buildJobFilter = ({ search, location, skill }) => {
  const filter = { isActive: true };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
    ];
  }

  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }

  if (skill) {
    filter.requiredSkills = { $elemMatch: { $regex: skill, $options: 'i' } };
  }

  return filter;
};

// Build MongoDB aggregation pipeline for skill-based job ranking
const buildRankedJobsPipeline = ({ filter, normalizedSkills, skip, limit }) => [
  { $match: filter },
  {
    $addFields: {
      normalizedRequiredSkills: {
        $map: {
          input: { $ifNull: ['$requiredSkills', []] },
          as: 'skill',
          in: {
            $toLower: {
              $trim: {
                input: '$$skill',
              },
            },
          },
        },
      },
    },
  },
  {
    $addFields: {
      matchedSkills: {
        $setIntersection: ['$normalizedRequiredSkills', normalizedSkills],
      },
    },
  },
  {
    $addFields: {
      matchScore: {
        $cond: [
          { $gt: [{ $size: '$normalizedRequiredSkills' }, 0] },
          {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      { $size: '$matchedSkills' },
                      { $size: '$normalizedRequiredSkills' },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
          0,
        ],
      },
    },
  },
  {
    $lookup: {
      from: 'users',
      localField: 'createdBy',
      foreignField: '_id',
      as: 'createdBy',
      pipeline: [
        {
          $project: {
            name: 1,
            email: 1,
            role: 1,
          },
        },
      ],
    },
  },
  {
    $unwind: {
      path: '$createdBy',
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      normalizedRequiredSkills: 0,
    },
  },
  {
    $facet: {
      jobs: [
        { $sort: { matchScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ],
      metadata: [{ $count: 'total' }],
    },
  },
];

// Fetch jobs ranked by skill match for job seekers
const getRankedJobs = async ({ filter, page, limit, currentUser }) => {
  const profile = await JobSeekerProfile.findOne({ user: currentUser._id }).select('skills');
  const normalizedSkills = normalizeSkills(profile?.skills || []);
  const skip = (page - 1) * limit;

  const [result] = await Job.aggregate(
    buildRankedJobsPipeline({
      filter,
      normalizedSkills,
      skip,
      limit,
    })
  );

  const total = result?.metadata?.[0]?.total || 0;

  return {
    jobs: result?.jobs || [],
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get jobs with skill-based ranking for job seekers, basic listing for others
export const getJobs = async (
  { page = 1, limit = 10, search, location, skill },
  currentUser
) => {
  const filter = buildJobFilter({ search, location, skill });

  const skip = (page - 1) * limit;

  if (currentUser?.role === 'job_seeker') {
    return getRankedJobs({ filter, page, limit, currentUser });
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  return {
    jobs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get single job by ID with skill matching for job seekers
export const getJobById = async (jobId, currentUser) => {
  if (currentUser?.role === 'job_seeker') {
    const profile = await JobSeekerProfile.findOne({ user: currentUser._id }).select('skills');
    const normalizedSkills = normalizeSkills(profile?.skills || []);

    const [job] = await Job.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(jobId),
          isActive: true,
        },
      },
      ...buildRankedJobsPipeline({
        filter: {},
        normalizedSkills,
        skip: 0,
        limit: 1,
      }).slice(1),
      {
        $project: {
          jobs: 1,
        },
      },
    ]);

    const rankedJob = job?.jobs?.[0];
    if (!rankedJob) {
      throw new ApiError(404, 'Job not found');
    }

    return rankedJob;
  }

  const job = await Job.findOne({ _id: jobId, isActive: true }).populate(
    'createdBy',
    'name email role'
  );

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  return job;
};

// Update job details (title, description, requirements, etc.)
export const updateJob = async (jobId, currentUser, updateData) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  ensureJobOwnership(job, currentUser);

  Object.assign(job, updateData);
  await job.save();

  return job.populate('createdBy', 'name email role');
};

// Soft delete job (mark as inactive rather than removing from DB)
export const deleteJob = async (jobId, currentUser) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  ensureJobOwnership(job, currentUser);

  job.isActive = false;
  await job.save();

  return job;
};
