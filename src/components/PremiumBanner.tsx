import { COPY } from '../lib/copy'

export function PremiumBanner() {
  return (
    <div className="premium-banner">
      <p className="premium-banner__title">{COPY.premium.title}</p>
      <p className="premium-banner__text">{COPY.premium.text}</p>
    </div>
  )
}
