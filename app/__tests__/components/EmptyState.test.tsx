import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { EmptyState } from '@/components/ui/EmptyState'

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No items found" />)
    expect(screen.getByText('No items found')).toBeTruthy()
  })

  it('renders the message when provided', () => {
    render(<EmptyState title="Empty" message="Add your first item to get started" />)
    expect(screen.getByText('Add your first item to get started')).toBeTruthy()
  })

  it('does not render message when not provided', () => {
    render(<EmptyState title="Empty" />)
    expect(screen.queryByText('Add your first item')).toBeNull()
  })

  it('renders action button when actionLabel and onAction provided', () => {
    render(
      <EmptyState
        title="Empty"
        actionLabel="Create New"
        onAction={jest.fn()}
      />,
    )
    expect(screen.getByText('Create New')).toBeTruthy()
  })

  it('calls onAction when action button is pressed', () => {
    const onAction = jest.fn()
    render(
      <EmptyState
        title="Empty"
        actionLabel="Create New"
        onAction={onAction}
      />,
    )
    fireEvent.press(screen.getByText('Create New'))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('does not render action button when actionLabel is provided but onAction is not', () => {
    render(<EmptyState title="Empty" actionLabel="Create New" />)
    expect(screen.queryByText('Create New')).toBeNull()
  })

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="Empty"
        icon={<Text>📭</Text>}
      />,
    )
    expect(screen.getByText('📭')).toBeTruthy()
  })
})
