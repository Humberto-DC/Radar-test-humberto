import Image from 'next/image'; // 1. Importar o componente

// Header.tsx
export default function Header() {
  return (
    <header className="
      fixed top-0 left-0 right-0 h-16
      bg-[#2323ff] shadow-2xl
      flex items-center px-4 z-50 gap-5
    ">
      <Image
        src="/logo.png"
        alt="Logo"
        width={200}
        height={200}
        className="h-full w-auto"   // pode testar h-12 ou h-14
      />
    </header>
  );
}
