"use client"

import * as React from "react"
import {
    CircleUserRound, Cable, HandHeart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

import { useEffect } from "react"

const data = {
  nav: [
    { name: "Profile", icon: CircleUserRound },
    { name: "Connections", icon: Cable },
    { name: "Support", icon: HandHeart },
  ],
}


function SettingsOverlay() {
    useEffect(() => {
        const handleOpen = () => setOpen(true);
        window.addEventListener("settings:open", handleOpen as EventListener);
        return () => {
        window.removeEventListener("settings:open", handleOpen as EventListener);
        };
    }, []);
  const [open, setOpen] = React.useState(true)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden bg-card max-h-160 p-0 pl-4 md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="p-6 sr-only pb-3 bg-transparent">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <div className="flex min-h-0 w-full h-160">
            <Sidebar collapsible="none"  className="hidden md:flex w-auto">
              <SidebarContent>
                  <SidebarHeader className="">
                    <h2 className="text-md font-semibold">Settings</h2>
                  </SidebarHeader>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {data.nav.map((item) => (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton
                            asChild
                            size="lg"
                          variant="outline"
                            isActive={item.name === "Profile"}
                          >
                            <a href="#">
                              <item.icon />
                              <span>{item.name}</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
            <main className="flex px-3 no-scrollbar flex-1 flex-col overflow-y-auto">
            {/* <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            </header> */}
            {/* Group */}
                <div className="flex-1 pb-16">
                    {/* Section */}
                    <div className="bg-muted/50 mt-11 max-w-3xl rounded-xl p-4">
                      <form>
                          <FieldGroup>
                          <FieldSet>
                              <FieldLegend>Profile</FieldLegend>
                              {/* <FieldDescription>
                              
                              </FieldDescription> */}
                              <FieldGroup>
                              <Field
                              orientation="responsive"
                              >
                                  <FieldLabel htmlFor="Preferred Name">
                                  Preferred Name
                                  </FieldLabel>
                                  <Input
                                  id="Preferred Name"
                                  placeholder="Greg"
                                  required
                                  />
                              </Field>
                            <Field
                              orientation="responsive"
                              >
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
                          {/* <Field orientation="horizontal">
                              <Button type="submit">Submit</Button>
                              <Button variant="outline" type="button">
                              Cancel
                              </Button>
                              </Field> */}
                      </form>
                    </div>
                    {/* Section */}
                    <div className="bg-muted/50 mt-11 max-w-3xl rounded-xl p-4">
                      <form>
                          <FieldGroup>
                          <FieldSet>
                              <FieldLegend>Profile</FieldLegend>
                              {/* <FieldDescription>
                              
                              </FieldDescription> */}
                              <FieldGroup>
                              <Field
                              orientation="responsive"
                              >
                                  <FieldLabel htmlFor="Preferred Name">
                                  Preferred Name
                                  </FieldLabel>
                                  <Input
                                  id="Preferred Name"
                                  placeholder="Greg"
                                  required
                                  />
                              </Field>
                              <FieldSeparator />
                            <Field
                              orientation="responsive"
                              >
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
                          {/* <Field orientation="horizontal">
                              <Button type="submit">Submit</Button>
                              <Button variant="outline" type="button">
                              Cancel
                              </Button>
                          </Field> */}
                      </form>
                    </div>
                </div>
            </main>
          </div>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
export default SettingsOverlay;