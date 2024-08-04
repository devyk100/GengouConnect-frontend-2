import {RefObject} from "react";
import {UserType} from "@/lib/types";

type WebrtcEvent = {
    sdp: string
    secret: string
    classId: string
    success: boolean
    isInstructorConnected: boolean
    userId: string
}

export class WebrtcConnectionOneToMany {
    private socket: WebSocket;
    private readonly userId: string;
    private readonly classId: string;
    private workerAddress: string;
    private videoRef: RefObject<HTMLVideoElement>;
    public static instance: WebrtcConnectionOneToMany;
    private userType: UserType;
    private peerConnection: RTCPeerConnection | undefined;
    private isConnected: boolean;

    private constructor(videoRef: RefObject<HTMLVideoElement>) {
        this.isConnected = false;
        this.userType = localStorage.getItem("UserType") as UserType;
        this.classId = localStorage.getItem("classId") as string;
        this.userId = localStorage.getItem("userId") as UserType;
        this.workerAddress = localStorage.getItem("workerAddress") as string;
        this.socket = new WebSocket(localStorage.getItem("workerAddress") as string);
        this.videoRef = videoRef
        this.socket.onopen = (event) => {
            this.peerConnection = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: [`stun:${process.env.NEXT_PUBLIC_TURN_IP}:3478`, "stun:stun.l.google.com:19302", `turn:${process.env.NEXT_PUBLIC_TURN_IP}:3478`,],
                        username: "user",
                        credential: "pass"
                    }
                ]
            })

            this.peerConnection.onicecandidate = (event) => {
                console.log(this.peerConnection?.iceConnectionState);
            }
            this.peerConnection.onicecandidate = (event) => {
                const localDes = btoa(JSON.stringify(this.peerConnection?.localDescription));
                if (event.candidate === null) {
                    console.log(localDes);
                    this.socket.send(JSON.stringify({
                        sdp: localDes,
                        classId: this.classId,
                        secret: localStorage.getItem("secret") as string,
                        success: true,
                        userId: this.userId
                    } as WebrtcEvent));
                }
            }

            if(this.userType === UserType.Instructor) {
                if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
                    navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(stream => {

                        // THERE COULD BE MULTIPLE, OR NOTHING, WITH AUDIO, HANDLE THAT CASE.

                        stream.getTracks().forEach(track => {
                            console.log(track, "FOUND");
                            this.peerConnection!.addTrack(track, stream);
                        })
                        console.log("ADDED STREAM TO VIDEO REF OUTSIDE")
                        if (videoRef != null ) {
                            // stream.getVideoTracks()
                            videoRef.current!.srcObject = stream
                            console.log("ADDED STREAM TO VIDEO REF")
                        }

                        this.peerConnection!.createOffer().then(desc => {
                            this.peerConnection!.setLocalDescription(desc).catch(console.log);
                        })

                    })
            } else {
                this.peerConnection.addTransceiver("video")
                this.peerConnection.addTransceiver("audio")
                this.peerConnection.createOffer().then(desc => {
                    this.peerConnection!.setLocalDescription(desc).catch(console.log);
                })

                this.peerConnection.ontrack = (event) => {
                    console.log(event.streams)
                    this.videoRef.current!.srcObject = event.streams[0]
                    this.videoRef.current!.autoplay = true
                    this.videoRef.current!.controls = true
                    this.videoRef.current!.play()
                }
            }

            this.socket.onmessage = (event) => {
                // the first payload from the server which tells us if the instructor was connected
                const data = JSON.parse(event.data) as WebrtcEvent;
                console.log(data)
                if(data.sdp != "") {
                    this.peerConnection?.setRemoteDescription(JSON.parse(atob(data.sdp)))
                    this.isConnected = true
                    console.log("Set the remote sdp")
                    // this.socket.onmessage = (event) => {}
                    return
                } else if(!data.isInstructorConnected && this.userType == UserType.Learner && data.sdp == ""){
                    console.log(!data.isInstructorConnected , this.userType == UserType.Learner , !this.isConnected)
                    console.log("Setting the timeouts")
                    if(this.userType === UserType.Learner) {
                        setTimeout(() => {
                            WebrtcConnectionOneToMany.instance = new WebrtcConnectionOneToMany(videoRef)
                            this.close()
                        }, 5000)

                    }
                }
                // else {
                //     this.peerConnection?.setRemoteDescription(JSON.parse(atob(data.sdp)))
                //     this.isConnected = true;
                // }
            }

        }
    }

    public close(){
        this.socket.close()
        this.peerConnection?.close()
    }

    public static getInstance(videoRef: RefObject<HTMLVideoElement>) {
        if (WebrtcConnectionOneToMany.instance) {
            return this.instance
        } else {
            this.instance = new WebrtcConnectionOneToMany(videoRef);
            return WebrtcConnectionOneToMany.instance;
        }
    }

}