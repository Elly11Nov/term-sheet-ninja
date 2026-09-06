# Deal Compass

Build a web app called "Term Sheet Negotiator".

Purpose:

The app helps startup founders evaluate an investor's proposed seed investment term sheet.

Create a clean, professional financial/AI dashboard. It should feel like a serious startup tool rather than a generic calculator.

The app should have two main views:

1. INPUT — where the founder enters the investor's proposed terms.

2. ANALYSIS — where the app displays the resulting deal assessment.

For the INPUT view, create the following sections:

INVESTMENT

- Ticket size (CHF)

- Company funding requirement (CHF)

- Pre-money valuation (CHF)

OWNERSHIP

- Investor equity (%)

- Founder ownership (%)

LIQUIDATION PREFERENCE

- Type dropdown:

  - 1x non-participating

  - 1x participating

  - 2x non-participating

  - 2x participating

VESTING

- Vesting period (years)

- Cliff (years)

BOARD & CONTROL

- Investor board seat: Yes/No

- Number of investor board seats

- Veto rights dropdown:

  - None

  - Limited major decisions

  - Broad

  - Day-to-day operations

ANTI-DILUTION

- Dropdown:

  - None

  - Broad-based weighted average

  - Full ratchet

  - Other

TRANCHES

- Number of tranches

- Milestone descriptions for up to 3 tranches

OPTIONAL EXIT SCENARIO

- Expected company exit value (CHF)

Add a prominent "ANALYZE DEAL" button.

Important:

The app should calculate automatically:

- Post-money valuation = pre-money valuation + ticket size

- Implied investor equity = ticket size / post-money valuation

- Founder ownership after investment

- Funding gap = funding requirement - ticket size

Do not connect to external APIs yet.

Do not add authentication yet.

Do not add a database yet.

Use local state for the first prototype.

Make the UI responsive and polished.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://term-sheet-ninja.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/80d8de65-667a-4cab-b8f6-9e8f9ca4b9bd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
