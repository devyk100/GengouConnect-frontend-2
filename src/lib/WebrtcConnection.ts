import {RefObject} from "react";
import {UserType} from "@/lib/types";

type WebrtcEvent = {
    sdp: string
    secret: string
    classId: string
    success: boolean
}

export class WebrtcConnection {
    private socket: WebSocket;
    private readonly userId: string;
    private readonly classId: string;
    private workerAddress: string;
    private videoRef: RefObject<HTMLVideoElement>;
    public static instance: WebrtcConnection;
    private userType: UserType;

    private constructor(videoRef: RefObject<HTMLVideoElement>) {
        this.userType = localStorage.getItem("UserType") as UserType;
        this.classId = localStorage.getItem("classId") as string;
        this.userId = localStorage.getItem("userId") as UserType;
        this.workerAddress = localStorage.getItem("workerAddress") as string;
        this.socket = new WebSocket(localStorage.getItem("workerAddress") as string);
        this.videoRef = videoRef
        this.socket.onopen = (event) => {

        }
    }

    public static getInstance(videoRef: RefObject<HTMLVideoElement>) {
        if (WebrtcConnection.instance) {
            return this.instance
        } else {
            this.instance = new WebrtcConnection(videoRef);
            return WebrtcConnection.instance;
        }
    }


}