import type { DeviceStatus } from '../types/interview'

type Props = {
  status: DeviceStatus
  message: string
}

const COLOR_CLASS: Record<DeviceStatus, string> = {
  ok: 'bg-semantic-success/20 text-semantic-success',
  warning: 'bg-semantic-warning/20 text-semantic-warning',
}

export default function DeviceStatusChip({ status, message }: Props) {
  return (
    <div className={`flex w-fit items-center gap-2 rounded-full px-3.5 py-2 text-body-md ${COLOR_CLASS[status]}`}>
      <span>{message}</span>
    </div>
  )
}
