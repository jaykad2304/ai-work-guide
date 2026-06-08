import AVFoundation

final class AudioEngine {
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let audioQueue = DispatchQueue(label: "home.walkie.audio")
    private let streamFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 16_000, channels: 1, interleaved: false)!

    private var converter: AVAudioConverter?
    private var isCapturing = false
    var onAudioData: ((Data) -> Void)?

    init() {
        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: streamFormat)
    }

    func prepare() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth])
        try session.setActive(true)

        if !engine.isRunning {
            try engine.start()
        }

        if !player.isPlaying {
            player.play()
        }
    }

    func startCapture() throws {
        guard !isCapturing else { return }
        try prepare()

        let input = engine.inputNode
        let inputFormat = input.outputFormat(forBus: 0)
        converter = AVAudioConverter(from: inputFormat, to: streamFormat)

        input.installTap(onBus: 0, bufferSize: 1024, format: inputFormat) { [weak self] buffer, _ in
            self?.convertAndSend(buffer)
        }

        isCapturing = true
    }

    func stopCapture() {
        guard isCapturing else { return }
        engine.inputNode.removeTap(onBus: 0)
        converter = nil
        isCapturing = false
    }

    func play(_ data: Data) {
        audioQueue.async { [weak self] in
            guard let self, !data.isEmpty else { return }

            do {
                try self.prepare()
            } catch {
                return
            }

            let frameCount = AVAudioFrameCount(data.count / MemoryLayout<Float>.size)
            guard let buffer = AVAudioPCMBuffer(pcmFormat: self.streamFormat, frameCapacity: frameCount) else { return }
            buffer.frameLength = frameCount

            data.withUnsafeBytes { rawBuffer in
                guard
                    let source = rawBuffer.bindMemory(to: Float.self).baseAddress,
                    let destination = buffer.floatChannelData?[0]
                else { return }
                destination.update(from: source, count: Int(frameCount))
            }

            self.player.scheduleBuffer(buffer, completionHandler: nil)
            if !self.player.isPlaying {
                self.player.play()
            }
        }
    }

    private func convertAndSend(_ inputBuffer: AVAudioPCMBuffer) {
        guard let converter else { return }

        let ratio = streamFormat.sampleRate / inputBuffer.format.sampleRate
        let outputCapacity = AVAudioFrameCount(Double(inputBuffer.frameLength) * ratio) + 1
        guard let outputBuffer = AVAudioPCMBuffer(pcmFormat: streamFormat, frameCapacity: outputCapacity) else { return }

        var error: NSError?
        var didProvideInput = false
        let status = converter.convert(to: outputBuffer, error: &error) { _, outStatus in
            if didProvideInput {
                outStatus.pointee = .noDataNow
                return nil
            }

            didProvideInput = true
            outStatus.pointee = .haveData
            return inputBuffer
        }

        guard status != .error, outputBuffer.frameLength > 0, let channel = outputBuffer.floatChannelData?[0] else { return }
        let byteCount = Int(outputBuffer.frameLength) * MemoryLayout<Float>.size
        onAudioData?(Data(bytes: channel, count: byteCount))
    }
}
