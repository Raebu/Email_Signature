import { createSignatureEngine } from '../src/index.js';

export const signatures = createSignatureEngine({
  defaultSignature: {
    name: 'Martin Raeburn',
    title: 'CEO',
    company: 'The Raeburn Group',
    website: 'https://theraeburngroup.com',
    accentColor: '#0C0F12',
    includeSenderEmail: true,
    legalLines: [
      'This email may contain confidential information intended only for the named recipient.'
    ]
  },

  organizations: [
    {
      id: 'raeburn-group',
      domains: ['theraeburngroup.com'],
      signature: {
        company: 'The Raeburn Group',
        website: 'https://theraeburngroup.com'
      }
    }
  ],

  domains: {
    'ventures.theraeburngroup.com': {
      company: 'Raeburn Ventures',
      website: 'https://ventures.theraeburngroup.com'
    },
    'gibp.global': {
      company: 'GIBP Global',
      website: 'https://gibp.global'
    },
    'gibp.app': {
      company: 'GIBP Mail',
      website: 'https://gibp.app'
    }
  },

  senders: {
    'support@theraeburngroup.com': {
      name: 'Raeburn Support',
      title: 'Support Team'
    }
  }
});
