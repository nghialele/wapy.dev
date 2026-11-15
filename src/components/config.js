export const siteConfig = {
  name: 'sub.idler.me',
  title: 'sub.idler.me - Subscription Tracker',
  description: 'A free subscription tracker hosted for people who cannot run their own. Track recurring expenses and get reminders before they charge you.',
  keywords: 'subscription tracker, recurring payments, expense tracker, free, self-hosted, idler.me',
  url: process.env.SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://sub.idler.me' : 'http://localhost:3000'),
  links: {
    github: 'https://github.com/meceware/wapy.dev',
  },
  author: {
    name: 'nghialele',
    url: 'https://nghialele.dev',
  },
  from: 'sub.idler.me',
};
