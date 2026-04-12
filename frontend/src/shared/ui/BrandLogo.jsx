export default function BrandLogo({ className = '', imageClassName = 'h-9 w-auto', alt = 'CompasX' }) {
  return (
    <div className={className}>
      <img src="/compasx-logo.svg" alt={alt} className={imageClassName} />
    </div>
  );
}
