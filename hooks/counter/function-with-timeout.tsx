import { useRef } from "react"

const useFuncWithTimeout = (func:(..._arguments:any[])=>void,milliseconds:number) => {
    const
        timeout = useRef<NodeJS.Timeout>(),
        execFuncWithTimeout = (..._args:any[]) => {
            clearTimeout(timeout.current)
            timeout.current = setTimeout(func,milliseconds,..._args)
        },
        execNow = (..._args:any[]) => {
            clearTimeout(timeout.current)
            func(..._args)
        }

    return [
        (...args:any[]) => execFuncWithTimeout(...args),
        (...args:any[]) => execNow(...args),
    ]
}

export default useFuncWithTimeout