import { useTheme } from "next-themes"

export function Gradient() {
    const { theme } = useTheme();

    return (
        <>
            {theme === "light" ? (
                <>
                    {/* Vignette */}
                    {/* <div className="fixed top-1/2 left-1/2 w-screen h-auto aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255)_60%,rgba(255,255,255,.2)_100%)] " /> */}
                    {/* gradient */}
                    <div className="-z-2 fixed top-1/2 left-1/2 w-screen aspect-square h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none backdrop-blur-xs [mask-image:radial-gradient(circle_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,.8)_97%)]"/>
                    <div className="fixed top-1/2 left-1/2 w-screen aspect-square h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10
                    bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_60%,rgba(255,255,255,0.2)_70%,rgba(255,255,255,.8)_97%)]" />
                    {/* noise (behind graph) */}
                    <div className="fixed inset-0 pointer-events-none z-[-1] noise" />
                    {/* Blur */}
                </>
            ) 
            :
            <>
                <div className="-z-2 fixed top-1/2 left-1/2 w-screen aspect-square h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none backdrop-blur-xs [mask-image:radial-gradient(circle_at_center,rgba(255,255,255,0)_60%,rgba(255,255,255,0.2)_70%,rgba(255,255,255,.8)_97%)]"/>
                <div className="fixed top-1/2 left-1/2 w-screen aspect-square h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10
                bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.2)_70%,rgba(0,0,0,.8)_97%)]" />
                <div className="fixed inset-0 pointer-events-none z-[-1] noise-dark" /> 
            </> }
        </>
    );
}
