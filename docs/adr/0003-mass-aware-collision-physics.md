# Mass-aware collision physics for boule/cochonnet impacts

Boule-to-boule collisions were resolved with an equal-mass impulse formula (`exchange = closingSpeed * COLLISION_RESTITUTION`, applied symmetrically). That assumption breaks once the cochonnet becomes a real physics body: a cochonnet is roughly 1/50th the mass of a boule in real pétanque, and the existing `BOULE_RADIUS_M`/`COCHONNET_RADIUS_M` constants already track real equipment proportions. Collisions now use a reduced-mass, momentum-conserving impulse formula driven by real masses (~700g boule, ~14g cochonnet), so a struck cochonnet flies off fast while the boule that hit it barely deflects — matching the real "shooting the jack" shot — rather than the two exchanging momentum as equals.

`COLLISION_RESTITUTION` was reinterpreted as a true physical restitution coefficient rather than retuned: at equal masses the new formula reduces to exactly the old numbers, so existing boule-vs-boule collision behavior (and its tests) is unaffected. Only pairs with differing mass — i.e. any boule-cochonnet impact — see new behavior.

## Considered Options

- **Hand-tuned mass ratio** (less extreme than real-world) for more predictable/controllable knock distances — rejected in favor of matching the already-real-world radii.
- **Keep the equal-mass formula** for all pairs, including the cochonnet — rejected as physically wrong and undermines the point of adding cochonnet collisions at all.

## Consequences

Adding a small body exposed two accuracy problems in the existing collision detection, both fixed alongside this change:

- **Tunneling**: collision detection is purely positional (checked once per fixed timestep, no continuous/swept check), so a boule moving at `MAX_THROW_SPEED_M_S` could skip clean over the cochonnet's small contact radius between two samples. Fixed by shrinking `FIXED_TIMESTEP_S` (1/480s) so no single step's displacement approaches the smallest contact distance in play.
- **Bounce clearance**: even with tunneling fixed, a literal sum-of-radii contact distance let a boule hop clean over the cochonnet during an ordinary post-landing bounce, since the cochonnet's low profile needs only a few centimeters of clearance to duck under a boule's contact envelope — something a point-particle model with no rotational/tangential contact will never resolve on its own. Fixed by sizing every pair's contact distance off the *larger* radius (`2 * max(a.radius, b.radius)`) rather than the sum, so a boule-cochonnet hit is exactly as reliable as a boule-boule one. This makes the resolved contact distance slightly more generous than the bodies' true rendered size, imperceptible given rendering already exaggerates boule/cochonnet size for visibility (see `render/draw.ts`).
