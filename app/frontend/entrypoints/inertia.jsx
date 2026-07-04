import axios from 'axios'
import { createInertiaApp } from '@inertiajs/react'

// Rails CSRF: forward the authenticity token from the layout meta tag on every
// non-GET request Inertia makes through axios.
const csrf = document.querySelector('meta[name=csrf-token]')?.content
if (csrf) axios.defaults.headers.common['X-CSRF-Token'] = csrf

createInertiaApp({
  pages: "../pages",

  strictMode: true,

  defaults: {
    form: {
      forceIndicesArrayFormatInFormData: false,
      withAllErrors: true,
    },
    visitOptions: () => {
      return { queryStringArrayFormat: "brackets" }
    },
  },
}).catch((error) => {
  // This ensures this entrypoint is only loaded on Inertia pages
  // by checking for the presence of the root element (#app by default).
  // Feel free to remove this `catch` if you don't need it.
  if (document.getElementById("app")) {
    throw error
  } else {
    console.error(
      "Missing root element.\n\n" +
      "If you see this error, it probably means you loaded Inertia.js on non-Inertia pages.\n" +
      'Consider moving <%= vite_javascript_tag "inertia.jsx" %> to the Inertia-specific layout instead.',
    )
  }
})
