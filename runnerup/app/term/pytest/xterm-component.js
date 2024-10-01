"use client"
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

const XTerm = forwardRef(({ onData }, ref) => {
  // Step 1: Create a ref for the internal div that xterm will use
  const divRef = useRef(null);
  const xtermRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (divRef.current) {
        // Step 2: Initialize the xterm instance with the internal div
        xtermRef.current = new Terminal();
        xtermRef.current.open(divRef.current);
        xtermRef.current.onData(onData);
      }

      return () => {
        xtermRef.current?.dispose();
      };
    }
  }, [onData]);

  // Step 3: Use useImperativeHandle to expose methods to the parent component
  useImperativeHandle(ref, () => ({
    write: (data) => xtermRef.current?.write(data),
    clear: () => xtermRef.current?.clear(),
  }));

  // Step 4: Attach the internal ref to the div for xterm to render into
  return <div ref={divRef} style={{ height: '100%' }} />;
});

XTerm.displayName = 'XTerm';

export default XTerm;