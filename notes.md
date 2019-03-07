[*Up*](./README.md)

# Notes

Just some general notes about the model.

- The component model is very much like a `(s, a) -> (s, b)` function where `s` is your state, `a` is your attributes + context, and `b` is your view. There's just a lot of sugar to hide this, since JS doesn't have an easy way to just map over the right side of a tuple like Haskell's `second`.
    - Or another way to see it: it's like the `map` function of an `instance Functor ((,) s) where ...`, which is typed as `map :: (s, a) -> (s, b)`.

- This API oddly translates better to WebAssembly.
    - Components could be class constructors