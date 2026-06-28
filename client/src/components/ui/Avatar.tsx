import { avatarFallback } from '@/utils/helpers';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-lg', xl: 'w-24 h-24 text-2xl' };

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover bg-[#21262d] flex-shrink-0 ${sizes[size]} ${className}`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div className={`rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white flex-shrink-0 ${sizes[size]} ${className}`}>
      {avatarFallback(name)}
    </div>
  );
}
