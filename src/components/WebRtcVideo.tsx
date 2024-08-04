"use client"
import {useSearchParams} from "next/navigation";
import {useEffect, useRef} from "react";
import {Button} from "@/components/ui/button";

export default function WebRtcVideo() {
    const searchParams = useSearchParams();
    const search = searchParams.get('user')

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws?type=0");
        ws.onopen = (event) => {
            console.log("WebRtcVideo: Opening WebRtcVideo");
        }
    }, []);

    return (
        <>
            {search}
            <video id={"video"} ref={videoRef} autoPlay muted></video>
            <Button>Unmute</Button>
        </>
    )
}