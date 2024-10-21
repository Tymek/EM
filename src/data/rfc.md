# Radio Band Plan description format

**Draft**, request for comments

Easy to read and write by humans, and easy to parse by machines.
Extension: `.rbp`

## General structure

The format uses indentation to denote hierarchy within a section.
Each level of hierarchy is indented by two spaces:

- level 1 - sections: No indentation ("WiFi", "2m", "ISS")
- level 2 - attributes: Indented by two spaces or tab (band, description, etc.).
- level 3 - sub-attributes or data: Further indented by an additional two spaces or tab.

### Example

```
PMR446
  band 446 MHz - 446.2 MHz
  description Private Mobile Radio
  keywords PMR, walkie-talkie
  mode NFM
  jurisdiction CEPT
  channels
    1-16
      center 446.00625 MHz
      spacing 12.5 kHz

2m
  band 144 MHz - 146 MHz
  description 2m amateur band
  jurisdiction IARU-1

  bandplan CSV MHz, mode, max_bandwidth, description
    144.000 - 144.025, ALL, 2700 #/ Satellite downlink only
    144.025 - 144.100, CW, 500, Telegraphy
    144.100 - 144.150, CW/MGM, 500, CW and MGM EME
    144.150 - 144.400, SSB/CW/MGM, 2700
    #// ...
```

## Notes and comments

```
#/ This is a note
#// This is a comment
```

Comments, starting from `#//` and until the end of that line are ignored.

Notes can be used to add additional information to proceding data.

Notes not proceeded by data can be used at any level to define terms used in the document or section.

```
#/ AM: Double Sideband Amplitude Modulated (DSB AM) ...
```

Notes proceeded by data add footnotes or additional metadata.

```
30m
  description 30m amateur band #/ WARC band

#// or

2m
  bandplan CSV MHz, mode, max_bandwidth, description
    144.000 - 144.025, ALL, 2700 #/ Satellite downlink only
```

## Sections

Section must start with non-indented unique identifier. It should have a band attribute.

```
amateur LF
  band 135.7 kHz - 137.8 kHz
  description LF amateur band
  jurisdiction IARU-1
```

## Attributes

Attributes are key-value pairs. They can be used level 2 or in some cases level 3.

### Attribute key

Attribute key is followed by a space. Space can be escaped with a backslash.

```
  attribute 123
  some\ atritbute value
```

### Attribute value

Attribute value is everything after the key and space until the end of the line, with exception of comments. Value can be empty.

```
  attribute value
```

Values associated with frequency are expressed with numbers and units. Units are case-insensitive. `Hz` suffix is optional.

```
  band 144.1 MHz
  max_bandwidth 2700
  //# or
  spacing 12.5k
```

### Attribute block

Some attributes have sub-attributes or data. These are indented by an additional two spaces or tab.

```
LF
  bandplan
    135.7 kHz - 137.8 kHz
      mode CW
```

### CSV notation

Some attributes can be expressed as CSV (comma separated values). Syntax below:

```
  attribute - GHz, header1, header2
    1, row1-value1, row1-value2
    2, row2-value1, row2-value2
```

is equivalent to:

```
  attribute
    1GHz
        header1 row1-value1
        header2 row1-value2
    2GHz
        header1 row2-value1
        header2 row2-value2
```

Commas can be escaped with a backslash.

# Attribute list and syntax

- `band` - Frequency range of the band. Format: `start - end`
- `description` - short description of the segment or attribute. If longer description is needed, use notes.
- `keywords` - comma separated list of tags used to categorize the segment
- `mode` - modulation mode. Examples: `FM`, `NFM`, `SSB`, `CW`, `AM`, `ALL`
- `jurisdiction` - regulatory body, agreement, or ISO-3166 country code that defines the band usage. Examples: `CEPT`, `IARU-1`, `EU`, `JP`
- `bandplan` - definition of band plan. See below.
- `channels` - definition of channels within the band. See below.
- `markers` - a list of important frequencies within a band. See below.

## Band plan

Each descending level of the band plan is a frequency range with attributes.

```
2m
  bandplan
    144.000 - 144.025
      mode ALL
      max_bandwidth 2700
    144.025 - 144.100
      mode CW
      max_bandwidth 500
```

## Channels

Each descending level of the channels is a channel with attributes. Channels can be defined individually or as a range.

```
    channels
        Unofficial channel #1 designation
            USB 5330.5 kHz
        Unofficial channel #2 designation
            USB 5346.5 kHz
```

or

```
    channels
        1-5 DV Internet voice gateway
            center 144.8125 MHz
            spacing 12.5 kHz
        1-4
            center 145.2375 MHz
            mode FM
            spacing 50 kHz
```

Channels with attribute key beginning in a format `start_number-end_number` are treated as a range. Properties are applied to all channels in the range, iterating using specified specing. For this use, `spacing` attribute is required, as well as one of `USB`/`LSB`/`center` attributes.

If there are subsequent declarations for the same channel (number and description), properties are merged.

## Markers

Important frequencies within a band. Listing information other then bands and channels.
