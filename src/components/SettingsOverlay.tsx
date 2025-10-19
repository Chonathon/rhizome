"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { CircleUserRound, Cable, HandHeart, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { ToggleButton } from "@/components/ui/ToggleButton"
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
import { toast } from "sonner"

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

// Change Email Dialog Component
const ChangeEmailDialog = ({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void
}) => {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Backend integration - submit email change request
    console.log("Change email request:", { newEmail, currentPassword })
    onOpenChange(false)
    setCurrentPassword("")
    setNewEmail("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogTitle>Change Email</DialogTitle>
        <DialogDescription>
          Enter your new email address and current password to update your account.
        </DialogDescription>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-email">New Email</FieldLabel>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="newemail@example.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="current-password-email">Current Password</FieldLabel>
              <Input
                id="current-password-email"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </Field>
          </FieldGroup>
          <div className="flex gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Update Email
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Change Password Dialog Component
const ChangePasswordDialog = ({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void
}) => {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      // TODO: Show error toast
      console.error("Passwords do not match")
      return
    }
    // TODO: Backend integration - submit password change request
    console.log("Change password request")
    onOpenChange(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogTitle>Change Password</DialogTitle>
        <DialogDescription>
          Enter your current password and choose a new password.
        </DialogDescription>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="current-password">Current Password</FieldLabel>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-password">New Password</FieldLabel>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm New Password</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Field>
          </FieldGroup>
          <div className="flex gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Update Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Logout Dialog Component
const LogoutDialog = ({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void
}) => {
  const handleLogout = () => {
    // TODO: Backend integration - logout user
    console.log("Logout request")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogTitle>Logout</DialogTitle>
        <DialogDescription>
          Are you sure you want to logout? You'll need to sign in again to access your account.
        </DialogDescription>
        <div className="flex gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleLogout}
            className="flex-1"
          >
            Logout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Delete Account Dialog Component
const DeleteAccountDialog = ({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void
}) => {
  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmText !== "DELETE") {
      // TODO: Show error toast
      console.error("Confirmation text does not match")
      return
    }
    // TODO: Backend integration - delete account
    console.log("Delete account request")
    onOpenChange(false)
    setPassword("")
    setConfirmText("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogTitle className="text-destructive">Delete Account</DialogTitle>
        <DialogDescription>
          This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
        </DialogDescription>
        <form onSubmit={handleDelete}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="delete-password">Current Password</FieldLabel>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-delete">
                Type "DELETE" to confirm
              </FieldLabel>
              <Input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                required
              />
            </Field>
          </FieldGroup>
          <div className="flex gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1"
              disabled={confirmText !== "DELETE"}
            >
              Delete Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Profile Section Component
const ProfileSection = ({
  onChangeEmail,
  onChangePassword,
  onLogout,
  onDeleteAccount
}: {
  onChangeEmail: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}) => {
  const { theme, setTheme } = useTheme()

  return (
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
                <Select value={theme || "system"} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
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
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={onChangeEmail}
                >
                  Change Email
                </Button>
              </Field>
              <Field orientation="responsive">
                <FieldContent>
                  <FieldLabel htmlFor="password">
                    Password
                  </FieldLabel>
                  <FieldDescription>Change your password to log in to your account</FieldDescription>
                </FieldContent>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={onChangePassword}
                >
                  Change Password
                </Button>
              </Field>
              <FieldSeparator />
              <Field orientation="responsive">
                <FieldLabel htmlFor="logout">
                  Logout
                </FieldLabel>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={onLogout}
                >
                  Logout
                </Button>
              </Field>
              <Field orientation="responsive">
                <FieldLabel className="text-destructive" htmlFor="delete-account">
                  Delete Account
                </FieldLabel>
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  onClick={onDeleteAccount}
                >
                  Delete Account
                </Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
    </SettingsSection>
  </>
  )
}

// Connections Section Component
const ConnectionsSection = () => {
  const [isLastFmConnected, setIsLastFmConnected] = useState(false);

  const handleLastFmToggle = () => {
    if (isLastFmConnected) {
      toast.info('Disconnected from Last.FM');
      setIsLastFmConnected(false);
    } else {
      toast.success('Connected to Last.FM');
      setIsLastFmConnected(true);
      // TODO: Implement actual Last.FM OAuth flow
    }
  };

  return (
    <SettingsSection>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Connections</FieldLegend>
          <FieldSeparator />
          <FieldGroup>
              {/* Last FM */}
                  <Field className="border bg-card rounded-2xl p-3" orientation="responsive">
                      <img aria-hidden="true" src="src/assets/Last.fm Logo.svg" className="size-8 @md/field-group:mr-2"/>
                      <FieldContent>
                      <FieldLabel htmlFor="lastfm-connection-description" id="lastfm-connection-label">
                          Last.FM
                      </FieldLabel>
                      <FieldDescription id="lastfm-connection-description">Two way sync: Import your followed artists and share your collection</FieldDescription>
                      </FieldContent>
                      <ToggleButton
                        isActive={isLastFmConnected}
                        onToggle={handleLastFmToggle}
                        activeLabel="Connected"
                        inactiveLabel="Connect"
                        activeIcon={<Check />}
                        // inactiveIcon={<Cable />}
                        // variant="outline"
                        size="sm"
                        ariaLabel={isLastFmConnected ? "Disconnect from Last.FM" : "Connect to Last.FM"}
                        ariaDescribedBy="lastfm-connection-description"
                      />
                  </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
            <p className="pt-3 text-sm text-muted-foreground">More connections coming soon...</p>
    </SettingsSection>
  );
}

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
              <FieldDescription>Your contributions keep our servers running!</FieldDescription>
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

function SettingsOverlay() {
  const [open, setOpen] = useState(false)
  const [activeView, setActiveView] = useState("Profile")

  // Dialog states
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent
      // If a specific view is requested, navigate to it
      if (customEvent?.detail?.view) {
        setActiveView(customEvent.detail.view)
      } else {
        // Default to Profile if no view specified
        setActiveView("Profile")
      }
      setOpen(true)
    }
    window.addEventListener("settings:open", handleOpen as EventListener)
    return () => {
      window.removeEventListener("settings:open", handleOpen as EventListener)
    }
  }, [])

  // View mapping
  const views: Record<string, React.ReactNode> = {
    Profile: (
      <ProfileSection
        onChangeEmail={() => setChangeEmailOpen(true)}
        onChangePassword={() => setChangePasswordOpen(true)}
        onLogout={() => setLogoutOpen(true)}
        onDeleteAccount={() => setDeleteAccountOpen(true)}
      />
    ),
    Connections: <ConnectionsSection />,
    Support: <SupportSection />,
  }

  return (
    <>
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

      {/* Account Action Dialogs */}
      <ChangeEmailDialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen} />
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
      <DeleteAccountDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />
    </>
  )
}

export default SettingsOverlay
