// swift-tools-version:5.9
import PackageDescription

// FOUNDATION ONLY — see STATUS.md. Not functional, not published.
//
// A real implementation needs a native WebRTC binary dependency (e.g.
// the `WebRTC-SDK` SPM package wrapping Google's WebRTC.xcframework) as
// a target dependency below. Left out here because it cannot be fetched
// or verified in this environment (no Xcode.app, no network fetch of a
// multi-hundred-MB binary framework attempted).
let package = Package(
    name: "PurpleCallio",
    platforms: [
        .iOS(.v13)
    ],
    products: [
        .library(name: "PurpleCallio", targets: ["PurpleCallio"])
    ],
    targets: [
        .target(name: "PurpleCallio", dependencies: [])
    ]
)
