import React, { DragEvent, ForwardedRef, forwardRef, memo, TouchEvent, useEffect, useRef } from "react";
import { useTheme } from "@mui/material";
import IconButton from '@mui/material/IconButton'
import { v4 as uuidv4 } from 'uuid'
import useNarrowBody from "hooks/theme/narrow-body";

const SmallScreenToggle = memo(forwardRef((
    {
        onClick,
        children,
    }:{
        onClick:()=>void;
        children:JSX.Element;
    },
    ref:ForwardedRef<HTMLButtonElement>
)=>{
    const 
        theme = useTheme(),
        {palette:{mode,primary}} = theme,
        m = useRef(20).current,
        buttonID = useRef(uuidv4()).current,
        narrowBody = useNarrowBody(),
        localStorageLeftKey = useRef('small-screen-toggle-left').current,
        localStorageTopKey = useRef('small-screen-toggle-top').current,
        updateTogglePosition = () => {
            const 
                {innerHeight,innerWidth} = window,
                button = document.getElementById(buttonID)
            if (!narrowBody) {
                button.style.display = 'none'
                button.style.top = null
                button.style.left = null
                return
            }
            const
                {offsetHeight,offsetWidth} = button,
                storageLeft = localStorage.getItem(localStorageLeftKey),
                storageTop = localStorage.getItem(localStorageTopKey),
                left = Math.round((!!storageLeft && !isNaN(+storageLeft) ? +storageLeft : 0.8) * innerWidth - offsetWidth * 0.5),
                top = Math.round((!!storageTop && !isNaN(+storageTop) ? +storageTop : 0.8) * innerHeight - offsetHeight * 0.5),
                finalLeft = Math.max(Math.min(innerWidth - m - offsetWidth,left),m),
                finalTop = Math.max(Math.min(innerHeight - m - offsetHeight,top),m + 56)

            button.style.left = `${finalLeft}px`
            button.style.top = `${finalTop}px`
            button.style.display = 'flex'

            localStorage.setItem(localStorageLeftKey,((finalLeft + offsetWidth * 0.5) / innerWidth).toString())
            localStorage.setItem(localStorageTopKey,((finalTop + offsetHeight * 0.5) / innerHeight).toString())
        },
        moveStart = useRef({touchTop:-1,touchLeft:-1,btnTop:-1,btnLeft:-1}),
        touching = useRef(false),
        onDragStart = (e:DragEvent<HTMLButtonElement>) => {
            const rect = document.getElementById(buttonID).getBoundingClientRect()
            moveStart.current = {
                touchLeft:e.pageX,
                touchTop:e.pageY,
                btnLeft:rect.left,
                btnTop:rect.top,
            }
        },
        onDrag = (e:DragEvent<HTMLButtonElement>) => {
            e.preventDefault()
            const button = document.getElementById(buttonID)
            button.style.left = `${e.pageX - moveStart.current.touchLeft + moveStart.current.btnLeft}px`
            button.style.top = `${e.pageY - moveStart.current.touchTop + moveStart.current.btnTop}px`
        },
        onDragEnd = (e:DragEvent<HTMLButtonElement>) => {
            e.preventDefault()
            const 
                {innerHeight,innerWidth} = window,
                button = document.getElementById(buttonID),
                {offsetHeight,offsetWidth} = button,
                left = e.pageX - moveStart.current.touchLeft + moveStart.current.btnLeft,
                top = e.pageY - moveStart.current.touchTop + moveStart.current.btnTop,
                finalLeft = Math.max(Math.min(innerWidth - m - offsetWidth,left),m),
                finalTop = Math.max(Math.min(innerHeight - m - offsetHeight,top),m + 56)

            button.style.left = `${finalLeft}px`
            button.style.top = `${finalTop}px`

            localStorage.setItem(localStorageLeftKey,((finalLeft + offsetWidth * 0.5) / innerWidth).toString())
            localStorage.setItem(localStorageTopKey,((finalTop + offsetHeight * 0.5) / innerHeight).toString())
        },
        onTouchStart = (e:TouchEvent<HTMLButtonElement>) => {
            if (e.touches.length !== 1) return
            document.body.style.overscrollBehavior = 'none'
            const 
                f = e.touches[0],
                button = document.getElementById(buttonID)
            moveStart.current = {
                touchLeft:f.pageX,
                touchTop:f.pageY,
                btnLeft:+button.style.left.replace('px',''),
                btnTop:+button.style.top.replace('px',''),
            }
        },
        onTouchEnd = () => {
            if (!touching.current) return

            document.body.style.overscrollBehavior = null
            touching.current = false

            const 
                button = document.getElementById(buttonID),
                rect = button.getBoundingClientRect(),
                {innerHeight,innerWidth} = window,
                {offsetHeight,offsetWidth} = button,
                left = rect.left,
                top = rect.top,
                finalLeft = Math.max(Math.min(innerWidth - m - offsetWidth,left),m),
                finalTop = Math.max(Math.min(innerHeight - m - offsetHeight,top),m + 56)

            button.style.left = `${finalLeft}px`
            button.style.top = `${finalTop}px`

            localStorage.setItem(localStorageLeftKey,((finalLeft + offsetWidth * 0.5) / innerWidth).toString())
            localStorage.setItem(localStorageTopKey,((finalTop + offsetHeight * 0.5) / innerHeight).toString())
        },
        onTouchMove = (e:TouchEvent<HTMLButtonElement>) => {
            touching.current = true
            const 
                f = e.touches[0],
                button = document.getElementById(buttonID)
            button.style.left = `${f.pageX - moveStart.current.touchLeft + moveStart.current.btnLeft}px`
            button.style.top = `${f.pageY - moveStart.current.touchTop + moveStart.current.btnTop}px`
        }

    useEffect(()=>{
        updateTogglePosition()
        window.addEventListener('resize',updateTogglePosition,{passive:true})
        return () => {
            window.removeEventListener('resize',updateTogglePosition)
        }
    },[narrowBody])

    return (
        <IconButton
            id={buttonID}
            ref={ref}
            size='large'
            disableRipple
            sx={{
                position:'fixed',
                zIndex:5,
                backgroundColor:primary.main,
                '.MuiSvgIcon-root':{
                    fill:mode==='light' ? '#fff' : '#000'
                },
            }}
            onClick={onClick}
            draggable
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            onTouchMove={onTouchMove}
        >
            {children}
        </IconButton>
    )
}))
SmallScreenToggle.displayName = 'SmallScreenToggle'
export default SmallScreenToggle