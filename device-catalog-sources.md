# Phone-model catalog: sources and limits

Derived from device facts maintained by **LineageOS wiki contributors**, copyright
2016–2026 LineageOS. Source content is offered under
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), as stated in the
[upstream footer](https://github.com/LineageOS/lineage_wiki/blob/bf49224b3a8838ad67f42e014435d5feeae5a668/_includes/layout/footer.html).
This adapted catalog of device facts is distributed under the same CC BY-SA 3.0
license. No endorsement by LineageOS is implied.

Pinned source: [bf49224b3a8838ad67f42e014435d5feeae5a668](https://github.com/LineageOS/lineage_wiki/tree/bf49224b3a8838ad67f42e014435d5feeae5a668/_data/devices).
The generated `device-catalog.js` includes each source YAML filename and SHA-256.
The builder selects phone entries, normalizes aliases, uses explicit userspace
architecture where provided, and adds conservative exclusions. It copies no
installation instructions, images or branding.

## Coverage

**253 phone profiles; 1,498 distinct exact aliases/model identifiers; 170 profiles
eligible for a model-based suggestion; 83 conservatively use Universal.** Counts
include regional variants and historical phones. They are not counts of physically
tested devices or guaranteed compatible stock Android installations.

| Manufacturer | Profiles |
| --- | ---: |
| ASUS | 13 |
| Google | 10 |
| Motorola | 50 |
| Nokia | 4 |
| OPPO | 8 |
| OnePlus | 10 |
| Realme | 9 |
| Samsung | 17 |
| Sony | 39 |
| Xiaomi | 93 |

The focus is Redmi/POCO, Galaxy A/M/J, Moto G/E, Nord, Pixel A and other available
lower/mid-range model families, alongside older devices. This is not a complete
phone directory. Unlisted Vivo, Tecno, Infinix, Samsung and other models retain the
Universal fallback until an appropriate source is added.

## What a model match establishes

LineageOS metadata describes device/ROM build architecture, **not necessarily the
ABIs supported by the phone's installed stock Android**. Every model suggestion
is labelled an estimate. No entry asserts Evidence Recorder camera, microphone,
thermal, battery or emergency-recording qualification.

A 64-bit CPU can have 32-bit Android userspace. ARM64 entries dated before 2019,
with missing or less than 4 GB minimum listed RAM, selected ambiguous userspace
models, and generic `moto g`/`moto e` labels are blocked from model-only suggestions.
This is a conservative filter, not a proof that remaining stock firmware supports
ARM64. An exact source-listed 32-bit userspace is kept distinct from CPU bitness.
No fuzzy family matching or guessed regional model suffixes are used. Regional
name aliases are shared only while all matching entries agree and none is blocked.

Browser CPU hints may be missing or describe browser/platform information. An
explicit hint is still a suggestion, not installed-ABI verification. Browser
process markers `armv7l`/`armv8l`, memory, GPU names and benchmark performance are
not used to claim Android ABI support. Model matching occurs locally, with no
telemetry, cookies, storage or external fingerprint service.

## Refreshing

Use an existing development Python with PyYAML. Take a reviewed checkout of the
upstream metadata and run from the Evidence Recorder repository:

```sh
python scripts/build-device-catalog.py /path/to/lineage_wiki/_data/devices --revision <full-commit-sha>
node --test tests/website/*.test.cjs
```

Review the generated diff and source hashes. The builder makes no network request
and fails when fewer than 100 focused phone entries are available. Refreshes and
additional sources require explicit review; devices are never fetched dynamically
from a third party while a user downloads the app.
