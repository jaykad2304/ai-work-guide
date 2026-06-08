# Home Walkie Talkie

A small iOS push-to-talk app for talking between iPhones on the same home network, without a backend server.

It uses:

- SwiftUI for the simple UI
- MultipeerConnectivity for local device discovery and peer-to-peer data
- AVAudioEngine for microphone capture and playback

## Run on iPhone

You need a Mac with Xcode.

1. Install XcodeGen if you do not already have it:

   ```sh
   brew install xcodegen
   ```

2. Generate the Xcode project:

   ```sh
   cd HomeWalkieTalkie
   xcodegen generate
   open HomeWalkieTalkie.xcodeproj
   ```

3. In Xcode, select the `HomeWalkieTalkie` target and set your Apple development team.

4. Run the app on two iPhones connected to the same Wi-Fi.

5. Allow microphone and local network permission on both phones.

6. Hold the blue button to talk. Release to stop.

## Notes

- This is intentionally serverless and local-first.
- MultipeerConnectivity can also use peer-to-peer Wi-Fi and Bluetooth when available, so devices may still discover each other nearby even outside a normal router network.
- For best results, test on real devices. The iOS simulator is not a good target for microphone and local peer discovery testing.
