import { useState } from 'react'
import { ZoomInIcon, ZoomOutIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ZoomButtons = () => {
  const [zoom, setZoom] = useState(95)

  const handleZoomIn = () => {
    if (zoom < 100) {
      setZoom(zoom + 5)
    }
  }

  const handleZoomOut = () => {
    if (zoom > 0) {
      setZoom(zoom - 5)
    }
  }

  return (
    <div className='flex-col w-fit -space-x-px rounded-full overflow-clip border rtl:space-x-reverse'>
      <Button
        variant='outline'
        size='icon'
        className='rounded-none border-none shadow-none focus-visible:z-10'
        onClick={handleZoomOut}
        disabled={zoom === 0}
      >
        <ZoomOutIcon />
        <span className='sr-only'>Zoom out</span>
      </Button>
      {/* <span className='bg-background dark:border-input dark:bg-input/30 flex items-center border px-3 text-sm font-medium'>
        {`${zoom}%`}
      </span> */}
      <Button
        variant='outline'
        size='icon'
        className='rounded-none border-none border-l shadow-none focus-visible:z-10'
        onClick={handleZoomIn}
        disabled={zoom === 100}
      >
        <ZoomInIcon />
        <span className='sr-only'>Zoom in</span>
      </Button>
    </div>
  )
}

export default ZoomButtons
