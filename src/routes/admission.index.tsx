import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admission/')({
  beforeLoad: () => {
    throw redirect({
      to: '/admission/apply',
    })
  },
})