import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { BreadcrumbHeader } from "./BreadcrumbHeader"
import { useSidebar } from "@/components/ui/sidebar"

interface HeaderProps {
  content?: React.ReactNode;
}


export function Header({ content }: HeaderProps) {
  const { state } = useSidebar()
  return (
    <header className={`flex w-full ${state === "collapsed" ? "border-0" : "bg-sidebar border-b"} z-50 shrink-0 items-center gap-2 h-[52px]`}>
      <div className="flex w-full items-center gap-1 pl-4 pr-3 lg:gap-2 ">
        {/* <SidebarTrigger className="-ml-1" /> */}
        {/* <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        /> */}
        <h1 className="text-base font-medium">Genres</h1>
        {/* Right items */}
        <div className="flex w-full items-center gap-2">

          {content}
          {/* <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button> */}
        </div>
      </div>
    </header>
  )
}