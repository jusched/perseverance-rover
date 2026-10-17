// Real photos hand-picked from the Mars 2020 raw_images API (latest days, color, with horizon, arm, ground or close-up rocks).
// utc = when the rover took it; the app computes "N days ago" from the current date.
export default {
  mastcam: [
    {"camera":"Mastcam-Z left","sol":2011,"utc":"2026-10-17T03:49:13.482Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02011/ids/edr/browse/zcam/ZL0_2011_0845479437_419EBY_N0920000ZCAM05065_0480LMJ01_1200.jpg","id":"ZL0_2011_0845479437_419EBY_N0920000ZCAM05065_0480LMJ"},
    {"camera":"Mastcam-Z right","sol":2009,"utc":"2026-10-14T20:50:52.923Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02009/ids/edr/browse/zcam/ZR0_2009_0845281537_443EBY_N0911496ZCAM10039_1100LMJ01_1200.jpg","id":"ZR0_2009_0845281537_443EBY_N0911496ZCAM10039_1100LMJ"},
    {"camera":"Mastcam-Z right","sol":2009,"utc":"2026-10-14T23:37:29.996Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02009/ids/edr/browse/zcam/ZR0_2009_0845291527_473EBY_N0911496ZCAM10042_1100LMJ01_1200.jpg","id":"ZR0_2009_0845291527_473EBY_N0911496ZCAM10042_1100LMJ"},
    {"camera":"Mastcam-Z left","sol":2009,"utc":"2026-10-14T20:56:55.926Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02009/ids/edr/browse/zcam/ZL0_2009_0845281896_568EBY_N0911496ZCAM04487_1100LMJ01_1200.jpg","id":"ZL0_2009_0845281896_568EBY_N0911496ZCAM04487_1100LMJ"},
    {"camera":"Mastcam-Z right","sol":2009,"utc":"2026-10-14T20:51:21.918Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02009/ids/edr/browse/zcam/ZR0_2009_0845281563_443EBY_N0911496ZCAM10039_1100LMJ01_1200.jpg","id":"ZR0_2009_0845281563_443EBY_N0911496ZCAM10039_1100LMJ"},
  ],
  navcam: [
    {"camera":"NavCam left","sol":2011,"utc":"2026-10-17T03:28:44.295Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02011/ids/edr/browse/ncam/NLF_2011_0845478216_410ECM_N0920000NCAM00347_01_195J01_1200.jpg","id":"NLF_2011_0845478216_410ECM_N0920000NCAM00347_01_195J"},
    {"camera":"NavCam left","sol":2009,"utc":"2026-10-15T02:06:37.092Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02009/ids/edr/browse/ncam/NLF_2009_0845300490_318ECM_N0920000NCAM03009_04_195J01_1200.jpg","id":"NLF_2009_0845300490_318ECM_N0920000NCAM03009_04_195J"},
    {"camera":"NavCam left","sol":2010,"utc":"2026-10-15T21:25:00.061Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02010/ids/edr/browse/ncam/NLF_2010_0845369992_991ECM_N0920000NCAM13009_01_195J01_1200.jpg","id":"NLF_2010_0845369992_991ECM_N0920000NCAM13009_01_195J"},
    {"camera":"NavCam left","sol":2010,"utc":"2026-10-15T21:25:00.061Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02010/ids/edr/browse/ncam/NLF_2010_0845369992_991ECM_N0920000NCAM13009_04_195J01_1200.jpg","id":"NLF_2010_0845369992_991ECM_N0920000NCAM13009_04_195J"},
  ],
  hazcam: [
    {"camera":"Front Hazcam left","sol":2011,"utc":"2026-10-17T03:37:25.762Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02011/ids/edr/browse/fcam/FLF_2011_0845478737_571ECM_N0920000FHAZ00206_01_295J01_1200.jpg","id":"FLF_2011_0845478737_571ECM_N0920000FHAZ00206_01_295J"},
    {"camera":"Front Hazcam left","sol":2011,"utc":"2026-10-17T03:41:06.665Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02011/ids/edr/browse/fcam/FLF_2011_0845478959_112ECM_N0920000FHAZ02008_07_095J01_1200.jpg","id":"FLF_2011_0845478959_112ECM_N0920000FHAZ02008_07_095J"},
    {"camera":"Front Hazcam left","sol":2011,"utc":"2026-10-17T03:41:06.665Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02011/ids/edr/browse/fcam/FLF_2011_0845478959_112ECM_N0920000FHAZ02008_04_095J01_1200.jpg","id":"FLF_2011_0845478959_112ECM_N0920000FHAZ02008_04_095J"},
    {"camera":"Front Hazcam left","sol":2006,"utc":"2026-10-11T22:49:10.061Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02006/ids/edr/browse/fcam/FLF_2006_0845029445_816ECM_N0911496FHAZ02008_10_095J01_1200.jpg","id":"FLF_2006_0845029445_816ECM_N0911496FHAZ02008_10_095J"},
  ],
  watson: [
    {"camera":"WATSON","sol":2011,"utc":"2026-10-17T04:03:45.501Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02011/ids/edr/browse/shrlc/SIF_2011_0845480315_050EBY_N0920000SRLC00729_0000LMJ01_1200.jpg","id":"SIF_2011_0845480315_050EBY_N0920000SRLC00729_0000LMJ"},
    {"camera":"WATSON","sol":2011,"utc":"2026-10-17T03:55:54.495Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02011/ids/edr/browse/shrlc/SIF_2011_0845479843_968EBY_N0920000SRLC02505_0000LMJ01_1200.jpg","id":"SIF_2011_0845479843_968EBY_N0920000SRLC02505_0000LMJ"},
    {"camera":"WATSON","sol":2011,"utc":"2026-10-17T02:35:18.448Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02011/ids/edr/browse/shrlc/SIF_2011_0845475007_925EBY_N0920000SRLC04003_0000LMJ01_1200.jpg","id":"SIF_2011_0845475007_925EBY_N0920000SRLC04003_0000LMJ"},
    {"camera":"WATSON","sol":2008,"utc":"2026-10-14T01:10:34.350Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02008/ids/edr/browse/shrlc/SIF_2008_0845210704_074EBY_N0911496SRLC00354_0000LMJ02_1200.jpg","id":"SIF_2008_0845210704_074EBY_N0911496SRLC00354_0000LMJ"},
    {"camera":"WATSON","sol":2011,"utc":"2026-10-17T02:37:57.453Z","url":"https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02011/ids/edr/browse/shrlc/SIF_2011_0845475166_562EBY_N0920000SRLC00730_0000LMJ01_1200.jpg","id":"SIF_2011_0845475166_562EBY_N0920000SRLC00730_0000LMJ"},
  ],
};
