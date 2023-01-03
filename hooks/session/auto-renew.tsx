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
        fiftyNineMinutes = useRef(3540000).current,
        fileTransmittingSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>googleFileSelector.selectAll(state).filter(e=>!!e.downloading).length !== 0,
            (state:ReduxState)=>googleFilePrelimSelector.selectAll(state).filter(e=>!e.googleFileID).length !== 0,
            (downloading:boolean,uploading:boolean) => downloading || uploading
        ),[]),
        fileTransmitting = useAppSelector(state => fileTransmittingSelector(state)),
        renewSessionInterval = useRef<NodeJS.Timer>(),
        renewSession = () => updateSession(router,dispatch)

    useEffect(()=>{
        if (fileTransmitting) {
            renewSession()
            renewSessionInterval.current = setInterval(renewSession,fiftyNineMinutes)
        }
        return () => clearInterval(renewSessionInterval.current)
    },[fileTransmitting])
}

export default useAutoRenewSession