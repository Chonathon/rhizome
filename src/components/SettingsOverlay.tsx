"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { CircleUserRound, Cable, HandHeart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldContent,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const data = {
  nav: [
    { name: "Profile", icon: CircleUserRound },
    { name: "Connections", icon: Cable },
    { name: "Support", icon: HandHeart },
  ],
}

// Reusable wrapper component for settings sections
const SettingsSection = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-muted/50 max-w-3xl rounded-xl p-6">
    {children}
  </div>
)

// Profile Section Component
const ProfileSection = () => (
  <>
    <SettingsSection>
      <form>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Profile</FieldLegend>
            <FieldSeparator />
            <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel htmlFor="Preferred Name">
                  Preferred Name
                </FieldLabel>
                <Input
                  id="Preferred Name"
                  placeholder="Greg"
                  required
                />
              </Field>
              <Field orientation="responsive">
                <FieldLabel htmlFor="theme">
                  Theme
                </FieldLabel>
                <Select defaultValue="system">
                  <SelectTrigger id="theme">
                    <SelectValue defaultValue="system" placeholder="" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
    </SettingsSection>

    <SettingsSection>
      <form>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Account</FieldLegend>
            <FieldSeparator />
            <FieldGroup>
              <Field orientation="responsive">
                <FieldContent>
                  <FieldLabel htmlFor="email">
                    Email
                  </FieldLabel>
                  <FieldDescription>email@email.com</FieldDescription>
                </FieldContent>
                <Button variant="outline" size="sm">Change Email</Button>
              </Field>
              <Field orientation="responsive">
                <FieldContent>
                  <FieldLabel htmlFor="password">
                    Password
                  </FieldLabel>
                  <FieldDescription>Change your password to log in to your account</FieldDescription>
                </FieldContent>
                <Button variant="outline" size="sm">Change Password</Button>
              </Field>
              <FieldSeparator />
              <Field orientation="responsive">
                <FieldLabel htmlFor="logout">
                  Logout
                </FieldLabel>
                <Button variant="outline" size="sm">Logout</Button>
              </Field>
              <Field orientation="responsive">
                <FieldLabel className="text-destructive" htmlFor="delete-account">
                  Delete Account
                </FieldLabel>
                <Button variant="destructive" size="sm">Delete Account</Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
    </SettingsSection>
  </>
)

// Connections Section Component
const ConnectionsSection = () => (
  <SettingsSection>
    <FieldGroup>
      <FieldSet>
        <FieldLegend>Connections</FieldLegend>
        <FieldSeparator />
        <FieldGroup>
          <p className="text-muted-foreground">Connections settings coming soon...</p>
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  </SettingsSection>
)

// Support Section Component
const SupportSection = () => (
  <SettingsSection>
    <FieldGroup>
      <FieldSet>
        <FieldLegend>Support</FieldLegend>
        <FieldSeparator />
        <FieldGroup>
          <Field orientation="responsive">
            <FieldContent>
              <FieldLabel htmlFor="email">
                Feedback & Requests
              </FieldLabel>
              <FieldDescription>We're just getting started. Let us know how we can improve Rhizome!</FieldDescription>
            </FieldContent>
            <Button
              variant="outline"
              onClick={() => window.dispatchEvent(new Event('feedback:open'))}
              size="sm"
            >
              Give feedback
            </Button>
          </Field>
          <Field orientation="responsive">
            <FieldContent>
              <FieldLabel htmlFor="password">
                Support Rhizome
              </FieldLabel>
              <FieldDescription>Your contributions help keep our servers running!</FieldDescription>
            </FieldContent>
            <a target="_blank" href="https://ko-fi.com/rhizomefyi">
              <Button size="sm">
                <img src="src/assets/kofi_symbol.svg" className="h-5 w-5"/>
                Support Rhizome
              </Button>
            </a>
          </Field>
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  </SettingsSection>
)

// View mapping
const views: Record<string, React.ReactNode> = {
  Profile: <ProfileSection />,
  Connections: <ConnectionsSection />,
  Support: <SupportSection />,
}

function SettingsOverlay() {
  const [open, setOpen] = useState(true)
  const [activeView, setActiveView] = useState("Profile")

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener("settings:open", handleOpen as EventListener)
    return () => {
      window.removeEventListener("settings:open", handleOpen as EventListener)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden bg-card max-h-160 pt-0 pl-4 md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="p-6 sr-only pb-3 bg-transparent">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <div className="flex min-h-0 w-full h-160">
            <Sidebar collapsible="none" className="pt-1.5 hidden md:flex w-[9rem]">
              <SidebarContent>
                <SidebarHeader>
                  <h2 className="text-md font-semibold">Settings</h2>
                </SidebarHeader>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {data.nav.map((item) => (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton
                            size="lg"
                            variant="outline"
                            isActive={item.name === activeView}
                            className={item.name === "Support" ? "text-[#8A80FF] hover:text-[#8A80FF] hover:brightness-110" : ""}
                            onClick={() => setActiveView(item.name)}
                          >
                            <item.icon />
                            <span>{item.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
            <main className="flex px-3 no-scrollbar flex-1 flex-col overflow-y-auto">
              <div className="flex-1 mt-11 pb-16 flex flex-col gap-6">
                {views[activeView]}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsOverlay
