import AVFoundation
import MultipeerConnectivity
import SwiftUI

final class WalkieTalkieManager: NSObject, ObservableObject {
    @Published private(set) var connectedPeers: [String] = []
    @Published private(set) var statusText = "Looking for nearby devices..."

    private let serviceType = "home-walkie"
    private let peerID = MCPeerID(displayName: UIDevice.current.name)
    private let audioEngine = AudioEngine()

    private lazy var session = MCSession(peer: peerID, securityIdentity: nil, encryptionPreference: .required)
    private lazy var advertiser = MCNearbyServiceAdvertiser(peer: peerID, discoveryInfo: nil, serviceType: serviceType)
    private lazy var browser = MCNearbyServiceBrowser(peer: peerID, serviceType: serviceType)

    override init() {
        super.init()
        session.delegate = self
        advertiser.delegate = self
        browser.delegate = self
        audioEngine.onAudioData = { [weak self] data in
            self?.sendAudio(data)
        }
    }

    func start() {
        advertiser.startAdvertisingPeer()
        browser.startBrowsingForPeers()
        updateStatus()
    }

    func startTalking() {
        guard !session.connectedPeers.isEmpty else {
            statusText = "No connected device yet."
            return
        }

        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            DispatchQueue.main.async {
                guard let self else { return }
                guard granted else {
                    self.statusText = "Microphone permission is required."
                    return
                }

                do {
                    try self.audioEngine.startCapture()
                    self.statusText = "Sending voice..."
                } catch {
                    self.statusText = "Could not start microphone."
                }
            }
        }
    }

    func stopTalking() {
        audioEngine.stopCapture()
        updateStatus()
    }

    private func sendAudio(_ data: Data) {
        guard !session.connectedPeers.isEmpty else { return }
        try? session.send(data, toPeers: session.connectedPeers, with: .unreliable)
    }

    private func refreshPeers() {
        let names = session.connectedPeers.map(\.displayName).sorted()
        DispatchQueue.main.async {
            self.connectedPeers = names
            self.updateStatus()
        }
    }

    private func updateStatus() {
        statusText = session.connectedPeers.isEmpty
            ? "Looking for nearby devices..."
            : "Hold the button and speak."
    }
}

extension WalkieTalkieManager: MCSessionDelegate {
    func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
        refreshPeers()
    }

    func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
        audioEngine.play(data)
    }

    func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {}
    func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {}
    func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}
}

extension WalkieTalkieManager: MCNearbyServiceAdvertiserDelegate {
    func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didReceiveInvitationFromPeer peerID: MCPeerID, withContext context: Data?, invitationHandler: @escaping (Bool, MCSession?) -> Void) {
        invitationHandler(true, session)
    }
}

extension WalkieTalkieManager: MCNearbyServiceBrowserDelegate {
    func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String: String]?) {
        guard !session.connectedPeers.contains(peerID), peerID != self.peerID else { return }
        browser.invitePeer(peerID, to: session, withContext: nil, timeout: 10)
    }

    func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {
        refreshPeers()
    }
}
