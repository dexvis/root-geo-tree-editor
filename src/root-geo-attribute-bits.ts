/**
 * @date Created on July 10, 2024
 * @author jsroot project
 *
 * @license MIT. Derived from JavaScript ROOT (https://github.com/root-project/jsroot),
 * which carries this notice:
 *
 *   Copyright (c) 2013-2026 JavaScript ROOT authors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *   THE SOFTWARE.
 *
 * Changes in this package: see the LICENSE file in the root directory of this repository.
 *
 * @summary This module defines utilities for manipulating and testing attribute bits (GeoAttBits)
 * within the CERN ROOT framework geometry package. It includes functions to set, toggle, and test various
 * visibility and attribute flags defined by the GeoAttBits enum.
 */


/** @summary TGeo Attribute Bits */
export enum GeoAttBits {
  kVisOverride = 1 << 0,     // volume's vis. attributes are overwritten
  kVisNone= 1 << 1,          // the volume/node is invisible, as well as daughters
  kVisThis= 1 << 2,          // this volume/node is visible
  kVisDaughters= 1 << 3,     // all leaves are visible
  kVisOneLevel= 1 << 4,      // first level daughters are visible (not used
  kVisStreamed= 1 << 5,      // true if attributes have been streamed
  kVisTouched= 1 << 6,       // true if attributes are changed after closing geom
  kVisOnScreen= 1 << 7,      // true if volume is visible on screen
  kVisContainers= 1 << 12,   // all containers visible
  kVisOnly= 1 << 13,         // just this visible
  kVisBranch= 1 << 14,       // only a given branch visible
  kVisRaytrace= 1 << 15      // raytracing flag
}

/** @summary Test fGeoAtt bits
 * @private */
export function testGeoBit(volume:any , f: GeoAttBits) {
  const att = volume.fGeoAtt;
  return att === undefined ? false : ((att & f) !== 0);
}


/** @summary Set fGeoAtt bit
 * @private */
export function setGeoBit(volume:any, f: GeoAttBits, value: number) {
  if (volume.fGeoAtt === undefined) return;
  volume.fGeoAtt = value ? (volume.fGeoAtt | f) : (volume.fGeoAtt & ~f);
}

/** @summary Toggle fGeoAttBit
 * @private */
export function toggleGeoBit(volume:any, f: GeoAttBits) {
  if (volume.fGeoAtt !== undefined)
    volume.fGeoAtt = volume.fGeoAtt ^ (f & 0xffffff);
}

/** @summary Prints the status of all geoBITS flags for a given volume
 * @param {Object} volume - The volume object to check
 * @private */
export function printAllGeoBitsStatus(volume:any) {
  const bitDescriptions = [
    { name: 'kVisOverride  ', bit: GeoAttBits.kVisOverride },
    { name: 'kVisNone      ', bit: GeoAttBits.kVisNone },
    { name: 'kVisThis      ', bit: GeoAttBits.kVisThis },
    { name: 'kVisDaughters ', bit: GeoAttBits.kVisDaughters },
    { name: 'kVisOneLevel  ', bit: GeoAttBits.kVisOneLevel },
    { name: 'kVisStreamed  ', bit: GeoAttBits.kVisStreamed },
    { name: 'kVisTouched   ', bit: GeoAttBits.kVisTouched },
    { name: 'kVisOnScreen  ', bit: GeoAttBits.kVisOnScreen },
    { name: 'kVisContainers', bit: GeoAttBits.kVisContainers },
    { name: 'kVisOnly      ', bit: GeoAttBits.kVisOnly },
    { name: 'kVisBranch    ', bit: GeoAttBits.kVisBranch },
    { name: 'kVisRaytrace  ', bit: GeoAttBits.kVisRaytrace }
  ];

  console.log(`fGeoAttr for ${volume._typename}: ${volume.fName}`);
  bitDescriptions.forEach(desc => {
    const isSet = testGeoBit(volume, desc.bit);
    console.log(`  ${desc.name}: ${isSet ? 'Yes' : 'No'}`);
  });
}
