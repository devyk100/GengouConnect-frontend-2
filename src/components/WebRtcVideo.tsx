"use client"
import {useSearchParams} from "next/navigation";
import {useEffect, useRef} from "react";
import {Button} from "@/components/ui/button";
import {WebrtcConnectionOneToMany} from "@/lib/WebrtcConnection";

export default function WebRtcVideo() {
    const searchParams = useSearchParams();
    const userType = searchParams.get('user')
    const videoRef = useRef<HTMLVideoElement>(null);
    // const ISSERVER = typeof window === "undefined";

    useEffect(() => {
        localStorage.setItem("UserType", userType as string)
        localStorage.setItem("classId", "123")
        localStorage.setItem("userId", Math.random().toString() as string)
        localStorage.setItem("workerAddress", `ws://localhost:8000/sfu?user=${userType}`)
            WebrtcConnectionOneToMany.getInstance(videoRef)
    }, []);

    return (
        <>
            {userType}
            <video id={"video"} ref={videoRef} autoPlay muted></video>
            <Button>Unmute</Button>
        </>
    )
}