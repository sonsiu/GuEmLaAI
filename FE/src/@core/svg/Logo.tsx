import Image from 'next/image'

type LogoProps = {
  className?: string
  width?: number
  height?: number
}

const Logo = ({ className, width = 40, height = 40 }: LogoProps) => {
  return <Image src='/logo-page.png' alt='logo' width={width} height={height} className={className} priority />
}

export default Logo
