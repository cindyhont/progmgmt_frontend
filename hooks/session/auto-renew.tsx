// only when transmitting files, so the user doesn't get logged out suddenly while the tranmission is not yet complete

import { updateSession } from "@components/functions"
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers"
import { googleFileSelector } from "@reducers/google-download-api/slice"
import { googleFilePrelimSelector } from "@reducers/google-upload-api/slice"
import { createSelector } from "@reduxjs/toolkit"
import { useRouter } from "next/router"
import { useEffect, useMemo, useRef } from "react"

const useAutoRenewSession = () => {
    const
        router = useRouter(),
        dispatch = useAppDispatch(),
        fileTransmittingSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>googleFileSelector.selectAll(state).filter(e=>!!e.downloading).length !== 0,
            (state:ReduxState)=>googleFilePrelimSelector.selectAll(state).filter(e=>!e.googleFileID).length !== 0,
            (downloading:boolean,uploading:boolean) => downloading || uploading
        ),[]),
        targetRenewTime = useRef(0),
        fileTransmitting = useAppSelector(state => fileTransmittingSelector(state)),
        pageVisibility = useAppSelector(state => state.misc.pageVisibility),
        renewSessionTimeout = useRef<NodeJS.Timeout>(),
        renewSession = () => updateSession(router,dispatch)

    useEffect(()=>{
        if (fileTransmitting) {
            renewSession()
            targetRenewTime.current = Date.now() + 3540000
            renewSessionTimeout.current = setTimeout(renewSession,3540000)
        }
        return () => clearTimeout(renewSessionTimeout.current)
    },[fileTransmitting])

    useEffect(()=>{
        const now = Date.now()
        if (pageVisibility && fileTransmitting && targetRenewTime.current > now){
            renewSessionTimeout.current = setTimeout(renewSession,targetRenewTime.current - now)
        }
        return () => clearTimeout(renewSessionTimeout.current)
    },[pageVisibility])
}

export default useAutoRenewSession