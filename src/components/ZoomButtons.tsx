import { ZoomInIcon, ZoomOutIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ZoomButtonsProps = {
  onZoomIn?: () => void
  onZoomOut?: () => void
}

const ZoomButtons: React.FC<ZoomButtonsProps> = ({ onZoomIn, onZoomOut }) => {
  return (
    <div className='flex flex-col w-fit -space-x-px rounded-full overflow-clip border rtl:space-x-reverse'>
      <Button
        variant='outline'
        size='icon'
        className='rounded-none border-none border-l shadow-none focus-visible:z-10'
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
        className='rounded-none border-none shadow-none focus-visible:z-10'
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
