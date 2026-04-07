// Variable autocomplete data for command responses
export const COMMAND_VARIABLES = [
  { name: '{{user}}', description: 'Display name of the user who triggered the command' },
  { name: '{{channel}}', description: 'Channel display name' },
  { name: '{{count}}', description: 'Number of times command has been used' },
  { name: '{{game}}', description: 'Current game being played' },
  { name: '{{title}}', description: 'Current stream title' },
  { name: '{{uptime}}', description: 'How long the stream has been live' },
  { name: '{{followers}}', description: 'Total follower count' },
  { name: '{{viewers}}', description: 'Current viewer count' },
  { name: '{{random 1 100}}', description: 'Random number between two values' },
  { name: '{{args}}', description: 'Arguments passed to the command' },
  { name: '{{arg1}}', description: 'First argument passed to the command' },
  { name: '{{date}}', description: 'Current date' },
  { name: '{{time}}', description: 'Current time' },
]

export function useCommandVariables() {
  return { variables: COMMAND_VARIABLES }
}
