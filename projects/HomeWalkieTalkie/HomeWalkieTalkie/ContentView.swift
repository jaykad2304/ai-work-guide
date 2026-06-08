import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var walkieTalkie: WalkieTalkieManager
    @State private var isHoldingToTalk = false

    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 8) {
                Text("Home Walkie")
                    .font(.largeTitle.bold())

                Text(walkieTalkie.statusText)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            VStack(alignment: .leading, spacing: 10) {
                Text("Connected")
                    .font(.headline)

                if walkieTalkie.connectedPeers.isEmpty {
                    Text("Open this app on another iPhone connected to the same Wi-Fi.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(walkieTalkie.connectedPeers, id: \.self) { peer in
                        Label(peer, systemImage: "iphone.gen2")
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Spacer()

            Circle()
                .fill(isHoldingToTalk ? Color.red : Color.blue)
                .frame(width: 220, height: 220)
                .overlay {
                    VStack(spacing: 10) {
                        Image(systemName: isHoldingToTalk ? "mic.fill" : "mic")
                            .font(.system(size: 54, weight: .bold))
                        Text(isHoldingToTalk ? "Talking" : "Hold to Talk")
                            .font(.title3.bold())
                    }
                    .foregroundStyle(.white)
                }
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { _ in
                            guard !isHoldingToTalk else { return }
                            isHoldingToTalk = true
                            walkieTalkie.startTalking()
                        }
                        .onEnded { _ in
                            isHoldingToTalk = false
                            walkieTalkie.stopTalking()
                        }
                )
                .accessibilityLabel("Hold to talk")

            Spacer()
        }
        .padding(24)
        .onAppear {
            walkieTalkie.start()
        }
    }
}
