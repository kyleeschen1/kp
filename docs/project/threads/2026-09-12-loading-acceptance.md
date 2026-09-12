# Loading acceptance

Eighteen fresh production cohorts (three routes, 1x/6x CPU, three repeats), plus
all tax companions activated, pass `npm run visual:architecture-cost --
--acceptance --activation`. See the adjacent measurements JSON for environment,
manifest hashes, every cohort and timing uncertainty. Main build precedes the
nested gradient build: building them concurrently can invalidate nested output.

| Actual initial gzip requests | Original audit | Accepted loading repair |
| --- | ---: | ---: |
| Tax JavaScript | 642,444 | 509,856 |
| Tax CSS | 30,307 | 22,520 |
| Tax fonts | 42,766 | 42,766 |
| Tax total, including HTML | 718,743 | 577,801 |
| Gradient JavaScript | 287,593 | 287,591 |
| Gradient CSS | 26,265 | 17,987 |
| Gradient fonts | 68,118 | 68,118 |
| Gradient total, including HTML | 382,264 | 373,983 |

Tax initial total is 19.6% smaller; its activated companions add 140,662 bytes,
bringing total requests to 718,463—effectively the original eager total, not a
large whole-application reduction. Gradient total is only 2.2% smaller despite
the substantial CSS reduction, because JavaScript and fonts dominate. The static
quadratic control stays effectively unchanged at 134,755 total gzip bytes.

At a hypothetical 1 Mbps, tax's payload-only transfer floor falls from about
5.75s to 4.62s. These are arithmetic transfer floors, not simulated network loads,
rendering times, or low-end-phone certification. Native code and 3D capability
cost remain payable when requested. The gradient active-frame problem remains
open and moves next to measured profiling, not another byte-budget amendment.

The small `architecture-loading-acceptance.ts` policy protects this fixed
390x844 request cohort: initial/activated JavaScript, CSS, fonts and total bytes.
Total includes unknown future asset formats. Missing categories, duplicate
identities, invalid measurements and page errors cannot falsely pass. Tax
acceptance requires the activation probe; it cannot claim success by omitting
the deferred cost. Limits provide bounded headroom while retaining meaningful
startup/CSS savings. They are not automatically regenerated from the current build.

Verification: both production builds, all 18 browser cohorts and activation,
full typecheck, eight focused loading/closure tests, and six packaged static
edition browser cases across Bayes/common-factor/composed-algebra at 390/1280.
The existing native-card interaction and layout evidence is preserved in the
earlier deferred-activation and focused-CSS reports. No new application runtime,
visual motif, generalized performance framework or server was introduced.
