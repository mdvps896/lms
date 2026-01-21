// Face API utility for face detection and verification
import * as faceapi from 'face-api.js'

let modelsLoaded = false

export const loadFaceApiModels = async () => {
    if (modelsLoaded) return true

    try {
        const MODEL_URL = '/models' // Models should be in public/models folder
        
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ])

        modelsLoaded = true
        return true
    } catch (error) {
        console.error('Error loading face API models:', error)
        return false
    }
}

export const detectFace = async (imageElement) => {
    try {
        if (!modelsLoaded) {
            await loadFaceApiModels()
        }

        const detection = await faceapi
            .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor()

        return detection
    } catch (error) {
        console.error('Face detection error:', error)
        return null
    }
}

export const compareFaces = async (image1Element, image2Element) => {
    try {
        if (!modelsLoaded) {
            await loadFaceApiModels()
        }

        const detection1 = await detectFace(image1Element)
        const detection2 = await detectFace(image2Element)

        if (!detection1 || !detection2) {
            return {
                match: false,
                distance: 1,
                similarity: 0,
                error: 'Could not detect face in one or both images'
            }
        }

        // Calculate Euclidean distance between face descriptors
        const distance = faceapi.euclideanDistance(
            detection1.descriptor,
            detection2.descriptor
        )

        // Convert distance to similarity percentage (0-100%)
        // Lower distance = higher similarity
        // Threshold typically around 0.6
        const similarity = Math.max(0, (1 - distance) * 100)
        const match = distance < 0.6 // Threshold for considering faces as matching

        return {
            match,
            distance,
            similarity,
            threshold: 0.6
        }
    } catch (error) {
        console.error('Face comparison error:', error)
        return {
            match: false,
            distance: 1,
            similarity: 0,
            error: error.message
        }
    }
}

export const drawFaceDetection = (canvas, detection) => {
    if (!canvas || !detection) return

    const ctx = canvas.getContext('2d')
    const displaySize = { width: canvas.width, height: canvas.height }

    faceapi.matchDimensions(canvas, displaySize)

    const resizedDetection = faceapi.resizeResults(detection, displaySize)
    
    // Draw detection box
    faceapi.draw.drawDetections(canvas, resizedDetection)
    
    // Draw face landmarks
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetection)
}

export const verifyLiveness = async (videoElement) => {
    try {
        if (!modelsLoaded) {
            await loadFaceApiModels()
        }

        // Capture multiple frames and check for expressions/movements
        const detections = []
        
        for (let i = 0; i < 5; i++) {
            const detection = await faceapi
                .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions()

            if (detection) {
                detections.push(detection)
            }

            // Wait 200ms between frames
            await new Promise(resolve => setTimeout(resolve, 200))
        }

        if (detections.length < 3) {
            return {
                isLive: false,
                confidence: 0,
                reason: 'Insufficient face detections'
            }
        }

        // Check for expression variations (indicates real person)
        const expressionVariations = checkExpressionVariations(detections)
        
        return {
            isLive: expressionVariations > 0.1,
            confidence: expressionVariations,
            reason: expressionVariations > 0.1 ? 'Face detected with natural movements' : 'Static image detected'
        }
    } catch (error) {
        console.error('Liveness verification error:', error)
        return {
            isLive: false,
            confidence: 0,
            reason: error.message
        }
    }
}

const checkExpressionVariations = (detections) => {
    if (detections.length < 2) return 0

    let totalVariation = 0
    const expressions = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised']

    for (let i = 1; i < detections.length; i++) {
        expressions.forEach(expr => {
            const prev = detections[i - 1].expressions[expr]
            const curr = detections[i].expressions[expr]
            totalVariation += Math.abs(curr - prev)
        })
    }

    return totalVariation / (detections.length - 1)
}

export const createImageElement = (imageSrc) => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = imageSrc
    })
}
