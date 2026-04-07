import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen'
import { MobileMoreScreen } from '@/features/navigation/screens/MobileMoreScreen'

export default function SettingsPage() {
  const { isPhone } = useBreakpoint()
  // On mobile the "Settings" tab is labelled "More" — it shows a nav list of
  // all pages that don't fit in the 5-item bottom tab bar. On tablet/desktop
  // the sidebar handles navigation so this route shows the actual settings UI.
  return isPhone ? <MobileMoreScreen /> : <SettingsScreen />
}
