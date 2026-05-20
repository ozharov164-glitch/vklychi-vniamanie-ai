const STORAGE_APP_V = 'fva_app_v'
const STORAGE_BUILD = 'fva_build_id'

/** Сброс sessionStorage при смене app_v (бот) или билда (Pages). */
export function enforceFreshDeploy(): void {
  const params = new URLSearchParams(window.location.search)
  const urlV = (params.get('app_v') || '').trim()
  const buildId = typeof __APP_BUILD_ID__ !== 'undefined' ? String(__APP_BUILD_ID__) : ''
  if (!urlV && !buildId) return

  try {
    const prevV = sessionStorage.getItem(STORAGE_APP_V)
    const prevBuild = sessionStorage.getItem(STORAGE_BUILD)
    const vChanged = Boolean(urlV && prevV && prevV !== urlV)
    const buildChanged = Boolean(buildId && prevBuild && prevBuild !== buildId)

    if (vChanged || buildChanged) {
      const backend = sessionStorage.getItem('fva_backend')
      sessionStorage.clear()
      if (backend) sessionStorage.setItem('fva_backend', backend)
      if (urlV) sessionStorage.setItem(STORAGE_APP_V, urlV)
      if (buildId) sessionStorage.setItem(STORAGE_BUILD, buildId)
      window.location.reload()
      return
    }

    if (urlV) sessionStorage.setItem(STORAGE_APP_V, urlV)
    if (buildId) sessionStorage.setItem(STORAGE_BUILD, buildId)
  } catch {
    /* private mode / quota */
  }
}
