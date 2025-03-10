(module
 (type $i32_=>_none (func (param i32)))
 (type $none_=>_none (func))
 (type $i32_i32_=>_none (func (param i32 i32)))
 (type $none_=>_i32 (func (result i32)))
 (type $i32_=>_i32 (func (param i32) (result i32)))
 (type $i32_i32_i32_=>_none (func (param i32 i32 i32)))
 (type $i32_i32_i32_i32_=>_none (func (param i32 i32 i32 i32)))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (import "rtrace" "onalloc" (func $~lib/rt/rtrace/onalloc (param i32)))
 (import "rtrace" "onincrement" (func $~lib/rt/rtrace/onincrement (param i32)))
 (import "rtrace" "ondecrement" (func $~lib/rt/rtrace/ondecrement (param i32)))
 (import "rtrace" "onfree" (func $~lib/rt/rtrace/onfree (param i32)))
 (memory $0 1)
 (data (i32.const 1024) "\n\00\00\00\01\00\00\00\01\00\00\00\n\00\00\00d\00o\00.\00t\00s")
 (data (i32.const 1056) "\1e\00\00\00\01\00\00\00\01\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00t\00l\00s\00f\00.\00t\00s")
 (data (i32.const 1104) "(\00\00\00\01\00\00\00\01\00\00\00(\00\00\00a\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e")
 (data (i32.const 1168) "\1e\00\00\00\01\00\00\00\01\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00p\00u\00r\00e\00.\00t\00s")
 (global $do/ran (mut i32) (i32.const 0))
 (global $~lib/rt/tlsf/ROOT (mut i32) (i32.const 0))
 (global $~lib/rt/tlsf/collectLock (mut i32) (i32.const 0))
 (global $~started (mut i32) (i32.const 0))
 (export "_start" (func $~start))
 (export "memory" (memory $0))
 (func $do/testNested
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  i32.const 10
  local.set $0
  loop $do-continue|0
   local.get $0
   i32.const 1
   i32.sub
   local.set $0
   local.get $2
   i32.const 1
   i32.add
   local.set $2
   loop $do-continue|1
    local.get $1
    i32.const 1
    i32.add
    local.set $1
    local.get $0
    i32.const 1
    i32.sub
    local.tee $0
    br_if $do-continue|1
   end
   local.get $0
   if
    i32.const 0
    i32.const 1040
    i32.const 39
    i32.const 5
    call $~lib/builtins/abort
    unreachable
   end
   local.get $1
   i32.const 9
   i32.ne
   if
    i32.const 0
    i32.const 1040
    i32.const 40
    i32.const 5
    call $~lib/builtins/abort
    unreachable
   end
   local.get $0
   br_if $do-continue|0
  end
  local.get $0
  if
   i32.const 0
   i32.const 1040
   i32.const 42
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $2
  i32.const 1
  i32.ne
  if
   i32.const 0
   i32.const 1040
   i32.const 43
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  i32.const 9
  i32.ne
  if
   i32.const 0
   i32.const 1040
   i32.const 44
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 1
  global.set $do/ran
 )
 (func $~lib/rt/tlsf/removeBlock (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  local.get $1
  i32.load
  local.tee $2
  i32.const 1
  i32.and
  i32.eqz
  if
   i32.const 0
   i32.const 1072
   i32.const 277
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $2
  i32.const -4
  i32.and
  local.tee $2
  i32.const 1073741808
  i32.lt_u
  i32.const 0
  local.get $2
  i32.const 16
  i32.ge_u
  select
  i32.eqz
  if
   i32.const 0
   i32.const 1072
   i32.const 279
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $2
  i32.const 256
  i32.lt_u
  if
   local.get $2
   i32.const 4
   i32.shr_u
   local.set $2
  else
   local.get $2
   i32.const 31
   local.get $2
   i32.clz
   i32.sub
   local.tee $3
   i32.const 4
   i32.sub
   i32.shr_u
   i32.const 16
   i32.xor
   local.set $2
   local.get $3
   i32.const 7
   i32.sub
   local.set $3
  end
  local.get $2
  i32.const 16
  i32.lt_u
  i32.const 0
  local.get $3
  i32.const 23
  i32.lt_u
  select
  i32.eqz
  if
   i32.const 0
   i32.const 1072
   i32.const 292
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  i32.load offset=20
  local.set $4
  local.get $1
  i32.load offset=16
  local.tee $5
  if
   local.get $5
   local.get $4
   i32.store offset=20
  end
  local.get $4
  if
   local.get $4
   local.get $5
   i32.store offset=16
  end
  local.get $1
  local.get $0
  local.get $2
  local.get $3
  i32.const 4
  i32.shl
  i32.add
  i32.const 2
  i32.shl
  i32.add
  i32.load offset=96
  i32.eq
  if
   local.get $0
   local.get $2
   local.get $3
   i32.const 4
   i32.shl
   i32.add
   i32.const 2
   i32.shl
   i32.add
   local.get $4
   i32.store offset=96
   local.get $4
   i32.eqz
   if
    local.get $0
    local.get $3
    i32.const 2
    i32.shl
    i32.add
    local.tee $4
    i32.load offset=4
    i32.const 1
    local.get $2
    i32.shl
    i32.const -1
    i32.xor
    i32.and
    local.set $1
    local.get $4
    local.get $1
    i32.store offset=4
    local.get $1
    i32.eqz
    if
     local.get $0
     local.get $0
     i32.load
     i32.const 1
     local.get $3
     i32.shl
     i32.const -1
     i32.xor
     i32.and
     i32.store
    end
   end
  end
 )
 (func $~lib/rt/tlsf/insertBlock (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  local.get $1
  i32.eqz
  if
   i32.const 0
   i32.const 1072
   i32.const 205
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  i32.load
  local.tee $4
  i32.const 1
  i32.and
  i32.eqz
  if
   i32.const 0
   i32.const 1072
   i32.const 207
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  i32.const 16
  i32.add
  local.get $1
  i32.load
  i32.const -4
  i32.and
  i32.add
  local.tee $5
  i32.load
  local.tee $2
  i32.const 1
  i32.and
  if
   local.get $4
   i32.const -4
   i32.and
   i32.const 16
   i32.add
   local.get $2
   i32.const -4
   i32.and
   i32.add
   local.tee $3
   i32.const 1073741808
   i32.lt_u
   if
    local.get $0
    local.get $5
    call $~lib/rt/tlsf/removeBlock
    local.get $1
    local.get $3
    local.get $4
    i32.const 3
    i32.and
    i32.or
    local.tee $4
    i32.store
    local.get $1
    i32.const 16
    i32.add
    local.get $1
    i32.load
    i32.const -4
    i32.and
    i32.add
    local.tee $5
    i32.load
    local.set $2
   end
  end
  local.get $4
  i32.const 2
  i32.and
  if
   local.get $1
   i32.const 4
   i32.sub
   i32.load
   local.tee $3
   i32.load
   local.tee $7
   i32.const 1
   i32.and
   i32.eqz
   if
    i32.const 0
    i32.const 1072
    i32.const 228
    i32.const 16
    call $~lib/builtins/abort
    unreachable
   end
   local.get $7
   i32.const -4
   i32.and
   i32.const 16
   i32.add
   local.get $4
   i32.const -4
   i32.and
   i32.add
   local.tee $8
   i32.const 1073741808
   i32.lt_u
   if (result i32)
    local.get $0
    local.get $3
    call $~lib/rt/tlsf/removeBlock
    local.get $3
    local.get $8
    local.get $7
    i32.const 3
    i32.and
    i32.or
    local.tee $4
    i32.store
    local.get $3
   else
    local.get $1
   end
   local.set $1
  end
  local.get $5
  local.get $2
  i32.const 2
  i32.or
  i32.store
  local.get $4
  i32.const -4
  i32.and
  local.tee $3
  i32.const 1073741808
  i32.lt_u
  i32.const 0
  local.get $3
  i32.const 16
  i32.ge_u
  select
  i32.eqz
  if
   i32.const 0
   i32.const 1072
   i32.const 243
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $3
  local.get $1
  i32.const 16
  i32.add
  i32.add
  local.get $5
  i32.ne
  if
   i32.const 0
   i32.const 1072
   i32.const 244
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $5
  i32.const 4
  i32.sub
  local.get $1
  i32.store
  local.get $3
  i32.const 256
  i32.lt_u
  if
   local.get $3
   i32.const 4
   i32.shr_u
   local.set $3
  else
   local.get $3
   i32.const 31
   local.get $3
   i32.clz
   i32.sub
   local.tee $4
   i32.const 4
   i32.sub
   i32.shr_u
   i32.const 16
   i32.xor
   local.set $3
   local.get $4
   i32.const 7
   i32.sub
   local.set $6
  end
  local.get $3
  i32.const 16
  i32.lt_u
  i32.const 0
  local.get $6
  i32.const 23
  i32.lt_u
  select
  i32.eqz
  if
   i32.const 0
   i32.const 1072
   i32.const 260
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  local.get $3
  local.get $6
  i32.const 4
  i32.shl
  i32.add
  i32.const 2
  i32.shl
  i32.add
  i32.load offset=96
  local.set $4
  local.get $1
  i32.const 0
  i32.store offset=16
  local.get $1
  local.get $4
  i32.store offset=20
  local.get $4
  if
   local.get $4
   local.get $1
   i32.store offset=16
  end
  local.get $0
  local.get $3
  local.get $6
  i32.const 4
  i32.shl
  i32.add
  i32.const 2
  i32.shl
  i32.add
  local.get $1
  i32.store offset=96
  local.get $0
  local.get $0
  i32.load
  i32.const 1
  local.get $6
  i32.shl
  i32.or
  i32.store
  local.get $0
  local.get $6
  i32.const 2
  i32.shl
  i32.add
  local.tee $0
  local.get $0
  i32.load offset=4
  i32.const 1
  local.get $3
  i32.shl
  i32.or
  i32.store offset=4
 )
 (func $~lib/rt/tlsf/addMemory (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 i32)
  (local $4 i32)
  local.get $2
  i32.const 15
  i32.and
  i32.eqz
  i32.const 0
  local.get $1
  i32.const 15
  i32.and
  i32.eqz
  i32.const 0
  local.get $1
  local.get $2
  i32.le_u
  select
  select
  i32.eqz
  if
   i32.const 0
   i32.const 1072
   i32.const 386
   i32.const 5
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.load offset=1568
  local.tee $3
  if
   local.get $1
   local.get $3
   i32.const 16
   i32.add
   i32.lt_u
   if
    i32.const 0
    i32.const 1072
    i32.const 396
    i32.const 16
    call $~lib/builtins/abort
    unreachable
   end
   local.get $3
   local.get $1
   i32.const 16
   i32.sub
   i32.eq
   if
    local.get $3
    i32.load
    local.set $4
    local.get $1
    i32.const 16
    i32.sub
    local.set $1
   end
  else
   local.get $1
   local.get $0
   i32.const 1572
   i32.add
   i32.lt_u
   if
    i32.const 0
    i32.const 1072
    i32.const 408
    i32.const 5
    call $~lib/builtins/abort
    unreachable
   end
  end
  local.get $2
  local.get $1
  i32.sub
  local.tee $2
  i32.const 48
  i32.lt_u
  if
   return
  end
  local.get $1
  local.get $4
  i32.const 2
  i32.and
  local.get $2
  i32.const 32
  i32.sub
  i32.const 1
  i32.or
  i32.or
  i32.store
  local.get $1
  i32.const 0
  i32.store offset=16
  local.get $1
  i32.const 0
  i32.store offset=20
  local.get $1
  local.get $2
  i32.add
  i32.const 16
  i32.sub
  local.tee $2
  i32.const 2
  i32.store
  local.get $0
  local.get $2
  i32.store offset=1568
  local.get $0
  local.get $1
  call $~lib/rt/tlsf/insertBlock
 )
 (func $~lib/rt/tlsf/maybeInitialize (result i32)
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  global.get $~lib/rt/tlsf/ROOT
  local.tee $1
  i32.eqz
  if
   i32.const 1
   memory.size
   local.tee $1
   i32.gt_s
   if (result i32)
    i32.const 1
    local.get $1
    i32.sub
    memory.grow
    i32.const 0
    i32.lt_s
   else
    i32.const 0
   end
   if
    unreachable
   end
   i32.const 1216
   local.set $1
   i32.const 1216
   i32.const 0
   i32.store
   i32.const 2784
   i32.const 0
   i32.store
   loop $for-loop|0
    local.get $0
    i32.const 23
    i32.lt_u
    if
     local.get $0
     i32.const 2
     i32.shl
     i32.const 1216
     i32.add
     i32.const 0
     i32.store offset=4
     i32.const 0
     local.set $2
     loop $for-loop|1
      local.get $2
      i32.const 16
      i32.lt_u
      if
       local.get $2
       local.get $0
       i32.const 4
       i32.shl
       i32.add
       i32.const 2
       i32.shl
       i32.const 1216
       i32.add
       i32.const 0
       i32.store offset=96
       local.get $2
       i32.const 1
       i32.add
       local.set $2
       br $for-loop|1
      end
     end
     local.get $0
     i32.const 1
     i32.add
     local.set $0
     br $for-loop|0
    end
   end
   i32.const 1216
   i32.const 2800
   memory.size
   i32.const 16
   i32.shl
   call $~lib/rt/tlsf/addMemory
   i32.const 1216
   global.set $~lib/rt/tlsf/ROOT
  end
  local.get $1
 )
 (func $~lib/rt/tlsf/searchBlock (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  local.get $0
  i32.load offset=4
  i32.const -2
  i32.and
  local.tee $2
  if (result i32)
   local.get $0
   local.get $2
   i32.ctz
   i32.const 2
   i32.shl
   i32.add
   i32.load offset=96
  else
   local.get $0
   i32.load
   i32.const -2
   i32.and
   local.tee $1
   if (result i32)
    local.get $0
    local.get $1
    i32.ctz
    local.tee $1
    i32.const 2
    i32.shl
    i32.add
    i32.load offset=4
    local.tee $2
    i32.eqz
    if
     i32.const 0
     i32.const 1072
     i32.const 351
     i32.const 18
     call $~lib/builtins/abort
     unreachable
    end
    local.get $0
    local.get $2
    i32.ctz
    local.get $1
    i32.const 4
    i32.shl
    i32.add
    i32.const 2
    i32.shl
    i32.add
    i32.load offset=96
   else
    i32.const 0
   end
  end
 )
 (func $~lib/rt/tlsf/allocateBlock (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  global.get $~lib/rt/tlsf/collectLock
  if
   i32.const 0
   i32.const 1072
   i32.const 500
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  call $~lib/rt/tlsf/searchBlock
  local.tee $1
  i32.eqz
  if
   i32.const 1
   global.set $~lib/rt/tlsf/collectLock
   i32.const 0
   global.set $~lib/rt/tlsf/collectLock
   local.get $0
   call $~lib/rt/tlsf/searchBlock
   local.tee $1
   i32.eqz
   if
    i32.const 16
    memory.size
    local.tee $2
    i32.const 16
    i32.shl
    i32.const 16
    i32.sub
    local.get $0
    i32.load offset=1568
    i32.ne
    i32.shl
    i32.const 65551
    i32.add
    i32.const -65536
    i32.and
    i32.const 16
    i32.shr_u
    local.set $1
    local.get $2
    local.get $1
    local.get $2
    local.get $1
    i32.gt_s
    select
    memory.grow
    i32.const 0
    i32.lt_s
    if
     local.get $1
     memory.grow
     i32.const 0
     i32.lt_s
     if
      unreachable
     end
    end
    local.get $0
    local.get $2
    i32.const 16
    i32.shl
    memory.size
    i32.const 16
    i32.shl
    call $~lib/rt/tlsf/addMemory
    local.get $0
    call $~lib/rt/tlsf/searchBlock
    local.tee $1
    i32.eqz
    if
     i32.const 0
     i32.const 1072
     i32.const 512
     i32.const 20
     call $~lib/builtins/abort
     unreachable
    end
   end
  end
  local.get $1
  i32.load
  i32.const -4
  i32.and
  i32.const 16
  i32.lt_u
  if
   i32.const 0
   i32.const 1072
   i32.const 520
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  i32.const 0
  i32.store offset=4
  local.get $1
  i32.const 3
  i32.store offset=8
  local.get $1
  i32.const 0
  i32.store offset=12
  local.get $0
  local.get $1
  call $~lib/rt/tlsf/removeBlock
  local.get $1
  i32.load
  local.tee $2
  i32.const -4
  i32.and
  i32.const 16
  i32.sub
  local.tee $3
  i32.const 32
  i32.ge_u
  if
   local.get $1
   local.get $2
   i32.const 2
   i32.and
   i32.const 16
   i32.or
   i32.store
   local.get $1
   i32.const 32
   i32.add
   local.tee $2
   local.get $3
   i32.const 16
   i32.sub
   i32.const 1
   i32.or
   i32.store
   local.get $0
   local.get $2
   call $~lib/rt/tlsf/insertBlock
  else
   local.get $1
   local.get $2
   i32.const -2
   i32.and
   i32.store
   local.get $1
   i32.const 16
   i32.add
   local.tee $0
   local.get $1
   i32.load
   i32.const -4
   i32.and
   i32.add
   local.get $0
   local.get $1
   i32.load
   i32.const -4
   i32.and
   i32.add
   i32.load
   i32.const -3
   i32.and
   i32.store
  end
  local.get $1
  call $~lib/rt/rtrace/onalloc
  local.get $1
 )
 (func $do/Ref#constructor (result i32)
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  call $~lib/rt/tlsf/maybeInitialize
  call $~lib/rt/tlsf/allocateBlock
  i32.const 16
  i32.add
  local.tee $1
  i32.const 1216
  i32.gt_u
  if
   local.get $1
   i32.const 16
   i32.sub
   local.tee $0
   i32.load offset=4
   local.tee $2
   i32.const -268435456
   i32.and
   local.get $2
   i32.const 1
   i32.add
   i32.const -268435456
   i32.and
   i32.ne
   if
    i32.const 0
    i32.const 1184
    i32.const 109
    i32.const 3
    call $~lib/builtins/abort
    unreachable
   end
   local.get $0
   local.get $2
   i32.const 1
   i32.add
   i32.store offset=4
   local.get $0
   call $~lib/rt/rtrace/onincrement
   local.get $0
   i32.load
   i32.const 1
   i32.and
   if
    i32.const 0
    i32.const 1184
    i32.const 112
    i32.const 14
    call $~lib/builtins/abort
    unreachable
   end
  end
  local.get $1
 )
 (func $~lib/rt/pure/__release (param $0 i32)
  local.get $0
  i32.const 1216
  i32.gt_u
  if
   local.get $0
   i32.const 16
   i32.sub
   call $~lib/rt/pure/decrement
  end
 )
 (func $start:do
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  i32.const 0
  global.set $do/ran
  i32.const 10
  local.set $0
  loop $do-continue|0
   local.get $1
   i32.const 1
   i32.add
   local.set $1
   local.get $0
   i32.const 1
   i32.sub
   local.tee $0
   br_if $do-continue|0
  end
  local.get $0
  if
   i32.const 0
   i32.const 1040
   i32.const 10
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  i32.const 10
  i32.ne
  if
   i32.const 0
   i32.const 1040
   i32.const 11
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 1
  global.set $do/ran
  i32.const 0
  global.set $do/ran
  i32.const 10
  local.set $1
  loop $do-continue|00
   local.get $1
   local.tee $0
   i32.const 1
   i32.sub
   local.set $1
   local.get $0
   br_if $do-continue|00
  end
  local.get $1
  i32.const -1
  i32.ne
  if
   i32.const 0
   i32.const 1040
   i32.const 21
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 1
  global.set $do/ran
  i32.const 0
  global.set $do/ran
  call $do/testNested
  global.get $do/ran
  i32.eqz
  if
   i32.const 0
   i32.const 1040
   i32.const 49
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 0
  global.set $do/ran
  i32.const 0
  local.set $0
  loop $do-continue|01
   local.get $0
   i32.const 1
   i32.add
   local.tee $0
   i32.const 10
   i32.ne
   br_if $do-continue|01
  end
  local.get $0
  i32.const 10
  i32.ne
  if
   i32.const 0
   i32.const 1040
   i32.const 56
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 1
  global.set $do/ran
  i32.const 0
  local.set $0
  loop $do-continue|02
   local.get $0
   i32.const 1
   i32.add
   local.tee $0
   i32.const 10
   i32.ne
   br_if $do-continue|02
  end
  local.get $0
  i32.const 10
  i32.ne
  if
   i32.const 0
   i32.const 1040
   i32.const 70
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 0
  global.set $do/ran
  i32.const 1
  global.set $do/ran
  i32.const 0
  global.set $do/ran
  i32.const 1
  global.set $do/ran
  i32.const 0
  global.set $do/ran
  i32.const 1
  global.set $do/ran
  i32.const 0
  global.set $do/ran
  i32.const 0
  local.set $0
  loop $do-continue|03
   local.get $0
   i32.const 1
   i32.add
   local.tee $0
   i32.const 10
   i32.ne
   br_if $do-continue|03
  end
  local.get $0
  i32.const 10
  i32.ne
  if
   i32.const 0
   i32.const 1040
   i32.const 116
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 1
  global.set $do/ran
  i32.const 0
  global.set $do/ran
  i32.const 0
  local.set $1
  i32.const 0
  local.set $0
  loop $do-continue|04
   local.get $1
   i32.const 1
   i32.add
   local.tee $1
   i32.const 10
   i32.ne
   if
    loop $do-continue|1
     local.get $0
     i32.const 1
     i32.add
     local.tee $0
     i32.const 10
     i32.rem_s
     br_if $do-continue|1
    end
    br $do-continue|04
   end
  end
  local.get $1
  i32.const 10
  i32.ne
  if
   i32.const 0
   i32.const 1040
   i32.const 134
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 90
  i32.ne
  if
   i32.const 0
   i32.const 1040
   i32.const 135
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 1
  global.set $do/ran
  i32.const 0
  global.set $do/ran
  call $do/Ref#constructor
  local.set $1
  loop $do-continue|05
   local.get $2
   i32.const 1
   i32.add
   local.tee $2
   i32.const 10
   i32.eq
   if
    i32.const 0
    local.set $0
    local.get $1
    if
     local.get $1
     call $~lib/rt/pure/__release
    end
   else
    call $do/Ref#constructor
    local.set $0
    local.get $1
    call $~lib/rt/pure/__release
   end
   local.get $0
   local.tee $1
   br_if $do-continue|05
  end
  local.get $2
  i32.const 10
  i32.ne
  if
   i32.const 0
   i32.const 1040
   i32.const 150
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  if
   i32.const 0
   i32.const 1040
   i32.const 151
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 1
  global.set $do/ran
  local.get $1
  call $~lib/rt/pure/__release
  global.get $do/ran
  i32.eqz
  if
   i32.const 0
   i32.const 1040
   i32.const 156
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 0
  global.set $do/ran
  i32.const 0
  local.set $2
  call $do/Ref#constructor
  local.set $1
  loop $do-continue|06
   block $do-break|0
    local.get $2
    i32.const 1
    i32.add
    local.tee $2
    i32.const 10
    i32.eq
    if
     local.get $1
     if
      local.get $1
      call $~lib/rt/pure/__release
     end
     i32.const 0
     local.set $1
     br $do-break|0
    end
    call $do/Ref#constructor
    local.tee $0
    call $~lib/rt/pure/__release
    local.get $0
    br_if $do-continue|06
   end
  end
  local.get $2
  i32.const 10
  i32.ne
  if
   i32.const 0
   i32.const 1040
   i32.const 170
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  if
   i32.const 0
   i32.const 1040
   i32.const 171
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 1
  global.set $do/ran
  local.get $1
  call $~lib/rt/pure/__release
  global.get $do/ran
  i32.eqz
  if
   i32.const 0
   i32.const 1040
   i32.const 176
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
 )
 (func $~start
  global.get $~started
  if
   return
  else
   i32.const 1
   global.set $~started
  end
  call $start:do
 )
 (func $~lib/rt/pure/decrement (param $0 i32)
  (local $1 i32)
  (local $2 i32)
  local.get $0
  i32.load offset=4
  local.tee $2
  i32.const 268435455
  i32.and
  local.set $1
  local.get $0
  call $~lib/rt/rtrace/ondecrement
  local.get $0
  i32.load
  i32.const 1
  i32.and
  if
   i32.const 0
   i32.const 1184
   i32.const 122
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  i32.const 1
  i32.eq
  if
   block $__inlined_func$~lib/rt/__visit_members
    block $switch$1$default
     block $switch$1$case$4
      local.get $0
      i32.const 8
      i32.add
      i32.load
      br_table $__inlined_func$~lib/rt/__visit_members $__inlined_func$~lib/rt/__visit_members $switch$1$case$4 $__inlined_func$~lib/rt/__visit_members $switch$1$default
     end
     local.get $0
     i32.load offset=16
     local.tee $1
     if
      local.get $1
      i32.const 1216
      i32.ge_u
      if
       local.get $1
       i32.const 16
       i32.sub
       call $~lib/rt/pure/decrement
      end
     end
     br $__inlined_func$~lib/rt/__visit_members
    end
    unreachable
   end
   local.get $2
   i32.const -2147483648
   i32.and
   if
    i32.const 0
    i32.const 1184
    i32.const 126
    i32.const 18
    call $~lib/builtins/abort
    unreachable
   end
   local.get $0
   local.get $0
   i32.load
   i32.const 1
   i32.or
   i32.store
   global.get $~lib/rt/tlsf/ROOT
   local.get $0
   call $~lib/rt/tlsf/insertBlock
   local.get $0
   call $~lib/rt/rtrace/onfree
  else
   local.get $1
   i32.const 0
   i32.le_u
   if
    i32.const 0
    i32.const 1184
    i32.const 136
    i32.const 16
    call $~lib/builtins/abort
    unreachable
   end
   local.get $0
   local.get $1
   i32.const 1
   i32.sub
   local.get $2
   i32.const -268435456
   i32.and
   i32.or
   i32.store offset=4
  end
 )
)
