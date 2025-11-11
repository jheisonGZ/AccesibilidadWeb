export async function fetcher(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }))
    throw new Error(error.error || "Error en la solicitud")
  }

  return response.json()
}

export async function authenticatedFetcher(url: string, token: string, options: RequestInit = {}) {
  return fetcher(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
}
