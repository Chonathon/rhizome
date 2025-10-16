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
                <div className="flex-1 pb-16">
                    <div className="bg-muted/50 mt-11 max-w-3xl rounded-xl p-4">
                      <form>
                          <FieldGroup>
                          <FieldSet>
                              <FieldLegend>Profile</FieldLegend>
                              <FieldDescription>
                              All transactions are secure and encrypted
                              </FieldDescription>
                              <FieldGroup>
                              <Field>
                                  <FieldLabel htmlFor="Preferred Name">
                                  Preferred Name
                                  </FieldLabel>
                                  <Input
                                  id="Preferred Name"
                                  placeholder="Evil Rabbit"
                                  required
                                  />
                              </Field>
                              <Field>
                                  <FieldLabel htmlFor="checkout-7j9-card-number-uw1">
                                  Card Number
                                  </FieldLabel>
                                  <Input
                                  id="checkout-7j9-card-number-uw1"
                                  placeholder="1234 5678 9012 3456"
                                  required
                                  />
                                  <FieldDescription>
                                  Enter your 16-digit card number
                                  </FieldDescription>
                              </Field>
                              <div className="grid grid-cols-3 gap-4">
                                  <Field>
                                  <FieldLabel htmlFor="checkout-exp-month-ts6">
                                      Month
                                  </FieldLabel>
                                  <Select defaultValue="">
                                      <SelectTrigger id="checkout-exp-month-ts6">
                                      <SelectValue placeholder="MM" />
                                      </SelectTrigger>
                                      <SelectContent>
                                      <SelectItem value="01">01</SelectItem>
                                      <SelectItem value="02">02</SelectItem>
                                      <SelectItem value="03">03</SelectItem>
                                      <SelectItem value="04">04</SelectItem>
                                      <SelectItem value="05">05</SelectItem>
                                      <SelectItem value="06">06</SelectItem>
                                      <SelectItem value="07">07</SelectItem>
                                      <SelectItem value="08">08</SelectItem>
                                      <SelectItem value="09">09</SelectItem>
                                      <SelectItem value="10">10</SelectItem>
                                      <SelectItem value="11">11</SelectItem>
                                      <SelectItem value="12">12</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  </Field>
                                  <Field>
                                  <FieldLabel htmlFor="checkout-7j9-exp-year-f59">
                                      Year
                                  </FieldLabel>
                                  <Select defaultValue="">
                                      <SelectTrigger id="checkout-7j9-exp-year-f59">
                                      <SelectValue placeholder="YYYY" />
                                      </SelectTrigger>
                                      <SelectContent>
                                      <SelectItem value="2024">2024</SelectItem>
                                      <SelectItem value="2025">2025</SelectItem>
                                      <SelectItem value="2026">2026</SelectItem>
                                      <SelectItem value="2027">2027</SelectItem>
                                      <SelectItem value="2028">2028</SelectItem>
                                      <SelectItem value="2029">2029</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  </Field>
                                  <Field>
                                  <FieldLabel htmlFor="checkout-7j9-cvv">CVV</FieldLabel>
                                  <Input id="checkout-7j9-cvv" placeholder="123" required />
                                  </Field>
                              </div>
                              </FieldGroup>
                          </FieldSet>
                          <FieldSeparator />
                          <FieldSet>
                              <FieldLegend>Billing Address</FieldLegend>
                              <FieldDescription>
                              The billing address associated with your payment method
                              </FieldDescription>
                              <FieldGroup>
                              <Field orientation="horizontal">
                                  <Checkbox
                                  id="checkout-7j9-same-as-shipping-wgm"
                                  defaultChecked
                                  />
                                  <FieldLabel
                                  htmlFor="checkout-7j9-same-as-shipping-wgm"
                                  className="font-normal"
                                  >
                                  Same as shipping address
                                  </FieldLabel>
                              </Field>
                              </FieldGroup>
                          </FieldSet>
                          <FieldSet>
                              <FieldGroup>
                              <Field>
                                  <FieldLabel htmlFor="checkout-7j9-optional-comments">
                                  Comments
                                  </FieldLabel>
                                  <Textarea
                                  id="checkout-7j9-optional-comments"
                                  placeholder="Add any additional comments"
                                  className="resize-none"
                                  />
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