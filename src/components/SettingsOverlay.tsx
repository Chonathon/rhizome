"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { CircleUserRound, Cable, HandHeart, Check, X, Cog, Info, Sparkle, Sparkles } from "lucide-react"
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
  SelectGroup,
  SelectLabel
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {Preferences, PreviewTrigger, Theme} from "@/types";
import KofiLogo from "@/assets/kofi_symbol.svg"
import LastFMLogo from "@/assets/Last.fm Logo.svg"
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"

const data = {
  nav: [
    { name: "General", icon: Cog },
    { name: "Account", icon: CircleUserRound },
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
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (newEmail: string) => Promise<boolean>;
}) => {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await onSubmit(newEmail);
    if (success) {
      toast.success('Successfully changed email.');
      onOpenChange(false);
      setCurrentPassword("");
      setNewEmail("");
    } else {
      toast.error('Error: could not change email.');
    }

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
export const ChangePasswordDialog = ({
  open,
  onOpenChange,
  onSubmitChange,
  onSubmitReset,
  navigateOnReset,
  forgot,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitChange: (newPassword: string, currentPassword: string) => Promise<boolean>;
  onSubmitReset?: (newPassword: string, token: string) => Promise<boolean>;
  navigateOnReset?: () => void;
  forgot: boolean;
}) => {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match!');
      return
    }
    let success;
    if (forgot) {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token || !onSubmitReset) {
        success = false;
      } else {
        success = await onSubmitReset(newPassword, token);
      }
    } else {
      success = await onSubmitChange(newPassword, currentPassword);
    }
    if (success) {
      toast.success('Successfully changed password.');
      onOpenChange(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (navigateOnReset) navigateOnReset();
    } else {
      toast.error('Error: could not change password');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogTitle>Change Password</DialogTitle>
        <DialogDescription>
          {forgot ? 'Enter a new password for your account.' : 'Enter your current password and choose a new password.'}
        </DialogDescription>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field hidden={forgot}>
              <FieldLabel htmlFor="current-password">Current Password</FieldLabel>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required={!forgot}
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
  onOpenChange,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => Promise<boolean>;
}) => {
  const handleLogout = async () => {
    const success = await onLogout();
    if (success) {
      toast.success('Successfully logged out.');
      onOpenChange(false);
    } else {
      toast.error('Error: could not log out.');
    }
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
  onOpenChange,
  onSubmit,
  isSocial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password?: string) => Promise<boolean>;
  isSocial: boolean;
}) => {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [awaitingEmail, setAwaitingEmail] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmText !== "DELETE") {
      // TODO: Show error toast
      console.error("Confirmation text does not match")
      return
    }
    if (isSocial) {
      const success  = await onSubmit();
      if (success){
        setAwaitingEmail(true);
      } else {
        toast.error("Error: could not delete account.");
      }
    } else {
      const success = await onSubmit(password);
      if (success) {
        toast.success('Successfully deleted account.');
        onOpenChange(false);
        setPassword("");
        setConfirmText("");
      } else {
        toast.error('Error: could not delete account.');
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogTitle className="text-destructive">Delete Account</DialogTitle>
        <form onSubmit={handleDelete}>
          {awaitingEmail ? (
              <DialogDescription>
                An email has been sent with a link to delete your account.
              </DialogDescription>
          ) : (
              <>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </DialogDescription>
                <FieldGroup>
                  {isSocial ? (
                      <div className="mt-2">
                        <FieldDescription>
                          You will receive an email to verify your account deletion.
                        </FieldDescription>
                      </div>
                  ) : (
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
                  )}
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
              </>
          )}
          <div className="flex gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {awaitingEmail ? 'Close' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1"
              disabled={confirmText !== "DELETE"}
            >
              {isSocial ? `${awaitingEmail ? 'Res' : 'S'}end Email` : 'Delete Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Profile Section Component
const ProfileSection = ({
  name,
  onNameChange,
  newName,
  setNewName,
}: {
  name: string;
  onNameChange: (newName: string) => Promise<boolean>;
  newName: string;
  setNewName: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const isDirty = newName !== name;
  const changeName = async () => {
    const success = await onNameChange(newName);
    if (success) {
      toast.success('Successfully changed name.');
    } else {
      toast.error('Error: could not change name.');
    }
  }
  return (
    <SettingsSection>
      <form onSubmit={(e) => e.preventDefault()}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Profile</FieldLegend>
            <FieldSeparator />
            <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel htmlFor="Preferred Name">
                  Preferred Name
                </FieldLabel>

                  <motion.div layout className="flex  gap-2 items-center"
                    transition={{layout: {delay: isDirty ? 0 : 0.4, duration: .2}}}>
                      <Input
                        id="Preferred Name"
                        placeholder="Greg"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && isDirty) {
                            e.preventDefault();
                            changeName();
                          }
                        }}
                        required
                      />
                    <AnimatePresence>
                      {isDirty && (
                        <motion.div
                          key="name-change-buttons"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1}}
                          exit={{ opacity: 0}}
                          transition={{duration: .2}}
                          className="flex gap-2"
                        >
                          <Button
                            className="size-9"
                            variant="secondary"
                            size="icon"
                            type="button"
                            onClick={() => {
                              setNewName(name)
                            }}
                            title="Cancel name change"
                          >
                            <X />
                          </Button>
                          <Button
                            className="size-9"
                            size="icon"
                            type="button"
                            onClick={changeName}
                            title="Change name"
                          >
                            <Check />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
    </SettingsSection>
  )
}

// Release Notes Section Component
const ReleaseNotesSection = () => {
  return (
    <SettingsSection>
      <FieldGroup>
           <Field orientation="responsive">
              <FieldLabel >
                Changelog
              </FieldLabel>
             <a className="w-full" target="_blank" href="https://www.notion.so/seanathon/Rhizome-Changelog-2cd7b160b42a8090ace6d43d3803b2ae?source=copy_link">
              <Button variant='outline' className="w-full" size="sm">
                <Sparkles />
                See what's new
              </Button>
            </a>
          </Field>
      </FieldGroup>
    </SettingsSection>
  )
}


// Preferences Section Component
const PreferencesSection = ({
  preferences,
  onPreferencesChange,
}: {
  preferences: Preferences;
  onPreferencesChange: (newPreferences: Preferences) => void;
}) => {
  const { theme, setTheme } = useTheme()
  const onThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    onPreferencesChange({...preferences, theme: newTheme});
  }
  return (
    <SettingsSection>
      <form onSubmit={(e) => e.preventDefault()}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Preferences</FieldLegend>
            <FieldSeparator />
            <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel htmlFor="theme">
                  Appearance
                </FieldLabel>
                <Select value={preferences.theme || "system"} onValueChange={onThemeChange}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Choose theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="preview-cards">Preview Cards</FieldLabel>
                  <FieldDescription>
                    Show preview cards when hovering over nodes
                  </FieldDescription>
                </FieldContent>
                <Select
                  value={preferences.previewTrigger || 'modifier'}
                  onValueChange={(value: PreviewTrigger) => {
                    onPreferencesChange({
                      ...preferences,
                      previewTrigger: value,
                      enableGraphCards: true
                    });
                  }}
                >
                  <SelectTrigger id="preview-cards">
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="sr-only">Preview Trigger</SelectLabel>
                      <SelectItem value="modifier">While holding CMD or CTRL</SelectItem>
                      <SelectItem value="delay">After a short delay</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </FieldSet>
          
        </FieldGroup>
      </form>
    </SettingsSection>
  )
}

// Experimental Features Section Component
// const ExperimentalFeaturesSection = ({
//   preferences,
//   onPreferencesChange,
// }: {
//   preferences: Preferences;
//   onPreferencesChange: (newPreferences: Preferences) => void;
// }) => {
//   return (
//     <SettingsSection>
//       <form onSubmit={(e) => e.preventDefault()}>
//         <FieldGroup>
//           <FieldSet>
//             <FieldLegend>Experimental Features</FieldLegend>
//             <FieldSeparator />
//             <FieldGroup>
//               <Field orientation="horizontal">
//                 <FieldContent>
//                   <FieldLabel htmlFor="hover-cards">Preview Cards</FieldLabel>
//                   <FieldDescription>
//                     Show preview cards when hovering over nodes
//                   </FieldDescription>
//                 </FieldContent>
//                 <Switch
//                   id="hover-cards"
//                   checked={preferences.enableGraphCards}
//                   onCheckedChange={(checked) => {
//                     onPreferencesChange({
//                       ...preferences,
//                       enableGraphCards: checked
//                     });
//                   }}
//                 />
//               </Field>
//             </FieldGroup>
//           </FieldSet>
//         </FieldGroup>
//       </form>
//     </SettingsSection>
//   )
// }

// Account Section Component
const AccountSection = ({
  onChangeEmail,
  onChangePassword,
  onLogout,
  onDeleteAccount,
  email,
  isSocial,
}: {
  onChangeEmail: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  email: string;
  isSocial: boolean;
}) => {
  return (
    <SettingsSection>
      <form>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Account</FieldLegend>
            <FieldSeparator />
            <FieldGroup>
              {!isSocial && (
                  <>
                    <Field orientation="responsive">
                      <FieldContent>
                        <FieldLabel htmlFor="email">
                          Email
                        </FieldLabel>
                        <FieldDescription>{email}</FieldDescription>
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
                  </>
              )}
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
  )
}

// Connections Section Component
const ConnectionsSection = () => {
  const [isLastFmConnected, setIsLastFmConnected] = useState(false);

  const handleLastFmToggle = () => {
    if (isLastFmConnected) {
      toast.info('Disconnected from Last.FM... Phew 😮‍💨');
      setIsLastFmConnected(false);
    } else {
      toast.success('Connected to Last.FM... Whoops, this isn\'t implemented yet 🙃');
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
                      <img aria-hidden="true" src={LastFMLogo} className="size-8 @md/field-group:mr-2"/>
                      <FieldContent>
                      <FieldLabel htmlFor="lastfm-connection-description" id="lastfm-connection-label">
                          Last.FM
                      </FieldLabel>
                      <FieldDescription id="lastfm-connection-description">Two way sync: Import your followed artists and share your collection</FieldDescription>
                      </FieldContent>
                      
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button
                              variant="secondary">
                              Connect 
                            </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" side="bottom">
                               <div
                                className="p-3">
                                  <div className="flex items-center gap-1">
                                    <Info size={20}/>
                                  <h2 className="text-lg font-semibold">Whoops, we haven’t implemented this yet</h2></div>
                                  <p className="text-base text-muted-foreground">
                                    How would you use connections in Rhizome?
                                  </p>

                                  <div className="mt-6">
                                    <Button asChild>
                                      <a 
                                        target="_blank" 
                                        href="https://tally.so/r/obEpvO"
                                        rel="noopener noreferrer"
                                        >Give Feedback</a>
                                    </Button>
                                  </div>
                                </div>
                         </DropdownMenuContent>
                       </DropdownMenu>
                       {/* Hidden while not functional */}
                      {/* <ToggleButton
                        isActive={isLastFmConnected}
                        onToggle={handleLastFmToggle}
                        activeLabel="Connected"
                        inactiveLabel="Connect"
                        // activeIcon={<Check />}
                        // inactiveIcon={<Cable />}
                        // variant="outline"
                        size="sm"
                        ariaLabel={isLastFmConnected ? "Disconnect from Last.FM" : "Connect to Last.FM"}
                        ariaDescribedBy="lastfm-connection-description"
                      /> */}
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
            <a className="w-full" target="_blank" href="https://ko-fi.com/rhizomefyi">
              <Button className="w-full" size="sm">
                <img src={KofiLogo} className="h-5 w-5"/>
                Support Rhizome
              </Button>
            </a>
          </Field>
          <Field orientation="responsive">
            <FieldContent>
              <FieldLabel htmlFor="password">
                Alpha Survey
              </FieldLabel>
              <FieldDescription>Thanks for signing up for Rhizome's alpha! Help us make it better with some quick feedback. It'll take 2 minutes 🌱</FieldDescription>
            </FieldContent>
            <a className="w-full" target="_blank" href="https://tally.so/r/3EjzA2">
              <Button variant='outline' className="w-full" size="sm">
                Take Survey
              </Button>
            </a>
          </Field>
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  </SettingsSection>
)

interface SettingsOverlayProps {
  email: string;
  name: string;
  socialUser: boolean;
  preferences: Preferences;
  onLogout: () => Promise<boolean>;
  onChangeEmail: (newEmail: string) => Promise<boolean>;
  onChangePassword: (newPassword: string, currentPassword: string) => Promise<boolean>;
  onDeleteAccount: (password?: string) => Promise<boolean>;
  onChangePreferences: (newPreferences: Preferences) => Promise<boolean>;
  onChangeName: (newName: string) => Promise<boolean>;
}

function SettingsOverlay({email, name, socialUser, preferences, onLogout, onChangeEmail, onChangePassword, onDeleteAccount, onChangePreferences, onChangeName}: SettingsOverlayProps) {
  const [open, setOpen] = useState(false)
  const [activeView, setActiveView] = useState("General")
  const [newName, setNewName] = useState<string>(name)
  const isDirty = newName !== name

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
        // Default to General if no view specified
        setActiveView("General")
      }
      setOpen(true)
    }
    window.addEventListener("settings:open", handleOpen as EventListener)
    return () => {
      window.removeEventListener("settings:open", handleOpen as EventListener)
    }
  }, [])

  // Sync newName when name prop changes
  useEffect(() => {
    setNewName(name)
  }, [name])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isDirty) {
      // Reset name if there are unsaved changes when closing
      setNewName(name)
    }
    setOpen(newOpen)
  }

  const handleEscapeKeyDown = (e: KeyboardEvent) => {
    if (isDirty) {
      // If there are unsaved changes, cancel the edit instead of closing
      e.preventDefault()
      setNewName(name)
    }
    // If not dirty, allow default behavior (close dialog)
  }

  // Main: View mapping
  const views: Record<string, React.ReactNode> = {
    General: (
      <>
        <ProfileSection
          name={name}
          onNameChange={onChangeName}
          newName={newName}
          setNewName={setNewName}
        />
        <PreferencesSection
          preferences={preferences}
          onPreferencesChange={onChangePreferences}
        />
        <ReleaseNotesSection />
        {/* <ExperimentalFeaturesSection
          preferences={preferences}
          onPreferencesChange={onChangePreferences}
        /> */}
      </>
    ),
    Account: (
      <AccountSection
        onChangeEmail={() => setChangeEmailOpen(true)}
        onChangePassword={() => setChangePasswordOpen(true)}
        onLogout={() => setLogoutOpen(true)}
        onDeleteAccount={() => setDeleteAccountOpen(true)}
        email={email}
        isSocial={socialUser}
      />
    ),
    Connections: <ConnectionsSection />,
    Support: <SupportSection />,
  }

  const closeOnSuccess = async (authFunction: () => Promise<boolean>) => {
    const success = await authFunction();
    if (success) {
      setOpen(false);
      return true;
    } else {
      return false;
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="overflow-hidden bg-card max-h-[calc(100dvh-3rem)] p-0 pt-0 sm:pl-3 sm:max-h-160 md:max-w-[700px] lg:max-w-[800px]"
          onEscapeKeyDown={handleEscapeKeyDown}
        >
          
          <DialogTitle className="p-6 pb-0 md:sr-only md:pb-3 bg-transparent">Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Customize your settings here.
          </DialogDescription>
          <SidebarProvider className="items-start ">
            <div className="flex flex-col md:flex-row min-h-0 w-full max-h-160">
              <Sidebar collapsible="none" className="bg-card md:pt-4 px-3 pb-2 md:pb-0 md:px-0 md:flex w-full md:w-[9rem]">
                <SidebarContent>
                  <SidebarHeader className="sr-only md:not-sr-only">
                    <h2 className="text-md px-3 font-semibold">Settings</h2>
                  </SidebarHeader>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="flex flex-row md:flex-col w-full  flex-wrap sm:flex-nowrap">
                        {data.nav.map((item) => (
                          <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton
                              size="lg"
                              variant="outline"
                              isActive={item.name === activeView}
                              // className={item.name === "Support" ? "text-[#8A80FF] hover:text-[#8A80FF] hover:brightness-110" : ""}
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
              <main className="flex px-3 pb-16 no-scrollbar min-h-0 flex-1 flex-col overflow-y-auto">
                {/* <div className="md:hidden ">
                  <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
                    <TabsList className="w-full justify-between">
                      {data.nav.map((item) => (
                        <TabsTrigger
                          key={item.name}
                          value={item.name}
                          className={item.name === "Support" ? "text-[#8A80FF] hover:text-[#8A80FF] hover:brightness-110 data-[state=active]:text-foreground" : undefined}
                        >
                          <item.icon className="mr-2 size-4" />
                          {item.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div> */}
                <div className="flex-1 mt-4 md:mt-11 pb-16 flex flex-col gap-2">
                  {views[activeView]}
                </div>
              </main>
            </div>
          </SidebarProvider>
        </DialogContent>
      </Dialog>

      {/* Account Action Dialogs */}
      <ChangeEmailDialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen} onSubmit={onChangeEmail} />
      <ChangePasswordDialog
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
          onSubmitChange={onChangePassword}
          forgot={false}
      />
      <LogoutDialog
          open={logoutOpen}
          onOpenChange={setLogoutOpen}
          onLogout={async () => {
            const success = await onLogout();
            if (success) {
              setOpen(false);
              return true;
            }
            return false;
          }
      }
      />
      <DeleteAccountDialog
          open={deleteAccountOpen}
          onOpenChange={setDeleteAccountOpen}
          onSubmit={onDeleteAccount}
          isSocial={true} // if password-only deletion is possible simultaneously with email verification, set this to socialUser
      />
    </>
  )
}

export default SettingsOverlay
