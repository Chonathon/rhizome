import { ZoomInIcon, ZoomOutIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ZoomButtonsProps = {
  onZoomIn?: () => void
  onZoomOut?: () => void
}

const ZoomButtons: React.FC<ZoomButtonsProps> = ({ onZoomIn, onZoomOut }) => {
  return (
    <div className='flex flex-col w-fit border overflow-hidden rounded-full bg-background/80 shadow-xs focus-within:ring-2 focus-within:ring-ring/40 focus-within:ring-offset-2 focus-within:ring-offset-background'>
      <Button
        variant='outline'
        size='icon'
        className='rounded-none border-0 border-b shadow-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none focus-visible:border-transparent first:rounded-t-full'
        onClick={onZoomIn}
        aria-label='Zoom in'
        title='Zoom in'
      >
        <ZoomInIcon />
        <span className='sr-only'>Zoom in</span>
      </Button>
      <Button
        variant='outline'
        size='icon'
        className='rounded-none border-0 shadow-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none focus-visible:border-transparent last:rounded-b-full'
        onClick={onZoomOut}
        aria-label='Zoom out'
        title='Zoom out'
      >
        <ZoomOutIcon />
        <span className='sr-only'>Zoom out</span>
      </Button>
    </div>
  )
}

export default ZoomButtons
