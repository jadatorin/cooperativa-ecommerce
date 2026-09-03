# Frontend Optimization Specification

## Purpose

Define frontend performance optimization requirements. The system SHALL migrate all raw `<img>` tags to `next/image`, add ISR/SWR for data fetching, implement dynamic imports for heavy components, and extract a shared cart enrichment utility.

## Requirements

### Requirement: next/image Migration

The system SHALL replace all raw `<img>` HTML elements with `next/image` `Image` component across all pages and components. Each `Image` MUST specify `width`, `height`, or `fill` prop to prevent layout shift.

#### Scenario: Product images use next/image

- GIVEN a product card component renders a product image
- WHEN the component renders
- THEN it SHALL use `next/image` `Image` component
- AND the image SHALL have explicit `width` and `height` props
- AND the image SHALL use `priority` prop above the fold

#### Scenario: Category images use next/image

- GIVEN a category grid component renders category images
- WHEN the component renders
- THEN each image SHALL use `next/image` `Image` component
- AND images SHALL use `fill` prop with a container aspect ratio

#### Scenario: Placeholder shown during image load

- GIVEN an image is being loaded for the first time
- WHEN the component renders
- THEN a blur placeholder or skeleton SHALL be displayed
- AND the `placeholder` prop SHALL be set to `"blur"` or `"empty"`

### Requirement: ISR/SWR for Product Data

The system SHALL use Incremental Static Regeneration (ISR) or SWR for product listing and category pages. Product listing pages SHALL revalidate at most every 60 seconds. Category pages SHALL revalidate at most every 120 seconds.

#### Scenario: Product listing uses ISR

- GIVEN a user navigates to the products page
- WHEN the page is server-rendered
- THEN product data SHALL be fetched with `revalidate: 60`
- AND subsequent visits within 60 seconds SHALL serve the cached page

#### Scenario: Category data uses SWR on client

- GIVEN a component fetches category data
- WHEN the data is loaded
- THEN SWR SHALL cache the result
- AND background revalidation SHALL occur every 120 seconds
- AND a stale-while-revalidate pattern SHALL show cached data first

#### Scenario: Stale data is shown while revalidating

- GIVEN cached product data exists and is stale
- WHEN a user visits the products page
- THEN the stale data SHALL be displayed immediately
- AND fresh data SHALL replace it in the background

### Requirement: Dynamic Imports for Heavy Components

The system SHALL use `next/dynamic` to lazy-load heavy or below-the-fold components. Checkout and order-history page content SHALL be dynamically imported.

#### Scenario: Checkout page uses dynamic import

- GIVEN the checkout page contains a heavy form component
- WHEN the checkout route is navigated to
- THEN the form component SHALL be loaded via `next/dynamic`
- AND a loading skeleton or spinner SHALL display during load

#### Scenario: Order history uses dynamic import

- GIVEN the order history page contains a detailed order table
- WHEN the order history route is navigated to
- THEN the table component SHALL be loaded via `next/dynamic`
- AND the page shell SHALL render immediately while the component loads

#### Scenario: Dynamic import does not affect SEO

- GIVEN a page uses dynamic import for non-critical content
- WHEN the page is crawled by a search engine
- THEN the initial HTML SHALL contain the page structure
- AND the dynamically imported content SHALL load client-side without affecting indexability

### Requirement: Shared Cart Enrichment Utility

The system SHALL extract a shared utility function for enriching cart items with product details. This utility SHALL be used by both server-side and client-side code to eliminate duplication.

#### Scenario: Utility enriches cart items with product data

- GIVEN a cart contains items with product IDs
- WHEN `enrichCartItems(cartItems)` is called
- THEN each item SHALL be augmented with product name, price, and image
- AND the result SHALL maintain the original cart item order

#### Scenario: Utility handles missing products gracefully

- GIVEN a cart contains a product ID that no longer exists
- WHEN enrichment is performed
- THEN the missing item SHALL be flagged or excluded
- AND the enrichment SHALL not throw an error

#### Scenario: Utility is reusable across contexts

- GIVEN CartContext and the cart page both need cart enrichment
- WHEN either invokes the utility
- THEN the same function SHALL be used (single source of truth)
- AND behavior SHALL be identical in both call sites

### Requirement: Image Performance Budget

The system SHALL ensure all images meet performance standards. Product images SHALL be served in WebP format where supported. Images SHALL use responsive `sizes` prop to serve appropriately sized variants.

#### Scenario: Product images use WebP format

- GIVEN a browser that supports WebP
- WHEN a product image is requested
- THEN the image SHALL be served in WebP format
- AND the `format` option SHALL be set to `"webp"` or the default shall handle this

#### Scenario: Responsive images use sizes prop

- GIVEN a product card renders an image at different viewport widths
- WHEN the image is rendered
- THEN the `sizes` prop SHALL specify appropriate breakpoints
- AND the browser SHALL request the smallest sufficient image variant
