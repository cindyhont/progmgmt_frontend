import { useFetchMoreConvosMutation } from "@components/chat/reducers/api"
import { chatConvoSelector, chatRoomSelector } from "@components/chat/reducers/slice"
import { ReduxState, useAppSelector } from "@reducers"
import { EntityId } from "@reduxjs/toolkit"
import { useRouter } from "next/router"
import { useEffect, useRef, useMemo } from "react"
import { useStore } from "react-redux"
import createConvoIdSelector from "./createConvoIdSelector"

const useFetchOldConvos = (editorLoaded:boolean) => {
    const
        {query} = useRouter(),
        roomID = query.roomid as string,
        store = useStore(),
        convoObserving = useRef<{id:EntityId;dt:number;}>(),
        intersectionObserver = useRef<IntersectionObserver>(),
        chatWindowMeasurement = useRef({t:0,b:0}),
        chatWindow = useRef<HTMLElement>(),
        convoElem = useRef<HTMLElement>(),
        [fetchMoreConvos] = useFetchMoreConvosMutation(),
        convoIDselector = useMemo(()=>createConvoIdSelector(roomID),[roomID]),
        convoCount = useAppSelector(state => convoIDselector(state).length),
        roomObserving = useRef<string>(),
        handleIntersectionObserver = (entries:IntersectionObserverEntry[],observer:IntersectionObserver) => {
            const targets = entries.filter(e=>e.isIntersecting)
            if (!!targets.length){
                const 
                    state = store.getState() as ReduxState,
                    room = chatRoomSelector.selectById(state,roomID)
                if (!!room?.fetchingConvos) fetchMoreConvos(roomID)
                targets.forEach(e=>observer.unobserve(e.target))
            }
        },
        onScroll = () => {
            if (!convoElem.current) return

            const {top,bottom} = convoElem.current.getBoundingClientRect()
            if (!(bottom < chatWindowMeasurement.current.t && top > chatWindowMeasurement.current.b)) {
                fetchMoreConvos(roomObserving.current)
                convoElem.current = undefined
            }
        },
        onResize = () => {
            const {top,bottom} = chatWindow.current.getBoundingClientRect()
            chatWindowMeasurement.current = {t:top,b:bottom}
        }

    useEffect(()=>{
        chatWindow.current = document.getElementById('convo-window')
        onResize()
        if (!('IntersectionObserver' in window)) window.addEventListener('resize',onResize,{passive:true})
        return () => window.removeEventListener('resize',onResize)
    },[])

    useEffect(()=>{
        setTimeout(()=>roomObserving.current = roomID,10)
        if (editorLoaded){
            const 
                state = store.getState() as ReduxState,
                room = chatRoomSelector.selectById(state,roomID)
            if (room?.hasMoreConvos){
                const convo = chatConvoSelector.selectAll(room).sort((a,b)=>a.dt - b.dt)[10]
                convoObserving.current = {id:convo.id,dt:convo.dt}
                if ('IntersectionObserver' in window){
                    intersectionObserver.current = new IntersectionObserver(handleIntersectionObserver,{root:chatWindow.current})
                    intersectionObserver.current.observe(document.getElementById(`${convo.id}`))
                } else {
                    convoElem.current = document.getElementById(`${convo.id}`)
                    chatWindow.current.addEventListener('scroll',onScroll,{passive:true})
                }
            } else convoElem.current = undefined
        }
        return () => {
            if (!!intersectionObserver.current) intersectionObserver.current.disconnect()
            chatWindow.current.removeEventListener('scroll',onScroll)
        }
    },[roomID,editorLoaded])

    useEffect(()=>{
        if (roomID === roomObserving.current && editorLoaded){
            const 
                state = store.getState() as ReduxState,
                room = chatRoomSelector.selectById(state,roomID)

            if (room?.hasMoreConvos){
                const convo = chatConvoSelector.selectAll(room).sort((a,b)=>a.dt - b.dt)[10]
                if (convo.dt < convoObserving.current.dt) {
                    convoObserving.current = {id:convo.id,dt:convo.dt}
                    if ('IntersectionObserver' in window){
                        intersectionObserver.current.observe(document.getElementById(`${convo.id}`))
                    } else {
                        convoElem.current = document.getElementById(`${convo.id}`)
                    }
                }
            } else {
                convoElem.current = undefined
            }
        }
    },[convoCount])
}

export default useFetchOldConvos