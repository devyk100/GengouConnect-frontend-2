import {RefObject} from "react";
import {UserType} from "@/lib/types";

type WebrtcEvent = {
    sdp: string
    secret: string
    classId: string
    disconnect: boolean
    userId: string
}

let count = 0;

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
    private isTimerSet: boolean;
    private constructor(videoRef: RefObject<HTMLVideoElement>) {
        console.log("Initialisation at the ", ++count, "time")
        this.isConnected = false;
        this.isTimerSet = false;
        this.userType = localStorage.getItem("UserType") as UserType;
        this.classId = localStorage.getItem("classId") as string;
        this.userId = localStorage.getItem("userId") as UserType;
        // console.log(this.userType)/**/
        this.workerAddress = localStorage.getItem("workerAddress") as string;
        this.socket = new WebSocket(localStorage.getItem("workerAddress") as string);
        console.log(localStorage.getItem("workerAddress"));
        this.videoRef = videoRef
        this.socket.onopen = (event) => {
            this.peerConnection = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: ["stun:stun.l.google.com:19302",],
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
                    console.log(this.userType, "is the user type inside of the onicecandidate")
                    console.log(localDes);
                    this.socket.send(JSON.stringify({
                        sdp: localDes,
                        classId: this.classId,
                        secret: localStorage.getItem("secret") as string,
                        disconnect: false,
                        userId: this.userId,
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
                if(data.disconnect) {
                    console.log("TRYING TO DISCONNECT")
                    this.close()
                    WebrtcConnectionOneToMany.instance = new WebrtcConnectionOneToMany(videoRef)
                    return
                } else {
                    this.peerConnection?.setRemoteDescription(JSON.parse(atob(data.sdp)))
                    this.isConnected = true
                    console.log("Set the remote sdp")
                }
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